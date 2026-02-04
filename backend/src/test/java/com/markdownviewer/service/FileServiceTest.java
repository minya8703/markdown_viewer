package com.markdownviewer.service;

import com.markdownviewer.entity.FileMetadata;
import com.markdownviewer.entity.User;
import com.markdownviewer.repository.FileMetadataRepository;
import com.markdownviewer.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * FileService 단위 테스트
 * listFiles, getMetadata, readFile, saveFile, deleteFile(일반/안전삭제) 검증
 */
@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @TempDir
    Path tempDir;

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FileService fileService;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(fileService, "basePath", tempDir.toString());
        user = User.builder()
                .id(1L)
                .googleSub("sub-1")
                .email("test@example.com")
                .name("Test User")
                .storageUsed(0L)
                .storageQuota(1024L * 1024 * 1024)
                .build();
    }

    @Test
    @DisplayName("listFiles - path null이면 전체 목록 반환")
    void listFiles_nullPath_returnsAll() {
        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("a.md")
                .fileName("a.md")
                .fileSize(10L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileMetadataRepository.findByUserOrderByFileNameAsc(user)).thenReturn(List.of(meta));

        List<FileMetadata> result = fileService.listFiles(user, null);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFilePath()).isEqualTo("a.md");
    }

    @Test
    @DisplayName("listFiles - path 지정 시 해당 디렉토리 하위만 반환")
    void listFiles_withPath_returnsFiltered() {
        FileMetadata inDir = FileMetadata.builder()
                .user(user)
                .filePath("docs/readme.md")
                .fileName("readme.md")
                .fileSize(100L)
                .lastModified(LocalDateTime.now())
                .build();
        FileMetadata root = FileMetadata.builder()
                .user(user)
                .filePath("root.md")
                .fileName("root.md")
                .fileSize(50L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileMetadataRepository.findByUserOrderByFileNameAsc(user)).thenReturn(List.of(inDir, root));

        List<FileMetadata> result = fileService.listFiles(user, "docs");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFilePath()).isEqualTo("docs/readme.md");
    }

    @Test
    @DisplayName("getMetadata - 존재하는 경로면 Optional.of 반환")
    void getMetadata_existing_returnsOptional() {
        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("x.md")
                .fileName("x.md")
                .fileSize(20L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileMetadataRepository.findByUserAndFilePath(user, "x.md")).thenReturn(Optional.of(meta));

        Optional<FileMetadata> result = fileService.getMetadata(user, "x.md");
        assertThat(result).isPresent();
        assertThat(result.get().getFilePath()).isEqualTo("x.md");
    }

    @Test
    @DisplayName("getMetadata - 존재하지 않으면 empty")
    void getMetadata_notFound_returnsEmpty() {
        when(fileMetadataRepository.findByUserAndFilePath(user, "missing.md")).thenReturn(Optional.empty());

        Optional<FileMetadata> result = fileService.getMetadata(user, "missing.md");
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getMetadata - path에 .. 포함 시 INVALID_PATH 예외")
    void getMetadata_pathTraversal_throws() {
        assertThatThrownBy(() -> fileService.getMetadata(user, "../etc/passwd"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("INVALID_PATH");
    }

    @Test
    @DisplayName("readFile - 파일 존재 시 내용 반환")
    void readFile_existing_returnsContent() throws Exception {
        Path userFiles = tempDir.resolve("users").resolve("1").resolve("files");
        Files.createDirectories(userFiles);
        Path filePath = userFiles.resolve("read.md");
        Files.writeString(filePath, "Hello Markdown");

        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("read.md")
                .fileName("read.md")
                .fileSize(14L)
                .encrypted(false)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileMetadataRepository.findByUserAndFilePath(user, "read.md")).thenReturn(Optional.of(meta));

        Optional<FileService.FileContentResult> result = fileService.readFile(user, "read.md");
        assertThat(result).isPresent();
        assertThat(result.get().getContent()).isEqualTo("Hello Markdown");
        assertThat(result.get().getMetadata().getFilePath()).isEqualTo("read.md");
    }

    @Test
    @DisplayName("readFile - 파일 없으면 empty")
    void readFile_fileNotExists_returnsEmpty() {
        when(fileMetadataRepository.findByUserAndFilePath(user, "none.md")).thenReturn(Optional.empty());

        Optional<FileService.FileContentResult> result = fileService.readFile(user, "none.md");
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("saveFile - 새 파일 저장 후 메타 반환")
    void saveFile_newFile_savesAndReturns() throws Exception {
        when(fileMetadataRepository.findByUserAndFilePath(user, "new.md")).thenReturn(Optional.empty());
        when(fileMetadataRepository.save(any(FileMetadata.class))).thenAnswer(inv -> {
            FileMetadata m = inv.getArgument(0);
            return FileMetadata.builder()
                    .id(1L)
                    .user(m.getUser())
                    .filePath(m.getFilePath())
                    .fileName(m.getFileName())
                    .fileSize(m.getFileSize())
                    .lastModified(m.getLastModified())
                    .build();
        });
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<FileMetadata> result = fileService.saveFile(user, "new.md", "# Title", false, null, null, null);
        assertThat(result).isPresent();
        assertThat(result.get().getFilePath()).isEqualTo("new.md");

        Path fullPath = tempDir.resolve("users").resolve("1").resolve("files").resolve("new.md");
        assertThat(Files.exists(fullPath)).isTrue();
        assertThat(Files.readString(fullPath, StandardCharsets.UTF_8)).isEqualTo("# Title");
    }

    @Test
    @DisplayName("deleteFile - 일반 삭제 시 파일 제거 후 true")
    void deleteFile_normal_deletesFileAndReturnsTrue() throws Exception {
        Path userFiles = tempDir.resolve("users").resolve("1").resolve("files");
        Files.createDirectories(userFiles);
        Path filePath = userFiles.resolve("del.md");
        Files.writeString(filePath, "content");

        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("del.md")
                .fileName("del.md")
                .fileSize(7L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileMetadataRepository.findByUserAndFilePath(user, "del.md")).thenReturn(Optional.of(meta));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean deleted = fileService.deleteFile(user, "del.md", false);
        assertThat(deleted).isTrue();
        assertThat(Files.exists(filePath)).isFalse();
        verify(fileMetadataRepository).delete(meta);
    }

    @Test
    @DisplayName("deleteFile - 안전 삭제(DoD) 시 파일 제거 후 true")
    void deleteFile_secure_overwritesAndDeletes() throws Exception {
        Path userFiles = tempDir.resolve("users").resolve("1").resolve("files");
        Files.createDirectories(userFiles);
        Path filePath = userFiles.resolve("secure.md");
        Files.writeString(filePath, "sensitive data");

        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("secure.md")
                .fileName("secure.md")
                .fileSize(14L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileMetadataRepository.findByUserAndFilePath(user, "secure.md")).thenReturn(Optional.of(meta));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean deleted = fileService.deleteFile(user, "secure.md", true);
        assertThat(deleted).isTrue();
        assertThat(Files.exists(filePath)).isFalse();
        verify(fileMetadataRepository).delete(meta);
    }

    @Test
    @DisplayName("deleteFile - 메타 없으면 false")
    void deleteFile_metaNotFound_returnsFalse() {
        when(fileMetadataRepository.findByUserAndFilePath(user, "missing.md")).thenReturn(Optional.empty());

        boolean deleted = fileService.deleteFile(user, "missing.md", false);
        assertThat(deleted).isFalse();
        verify(fileMetadataRepository, never()).delete(any());
    }
}
