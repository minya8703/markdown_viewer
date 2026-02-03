package com.markdownviewer.service;

import com.markdownviewer.entity.FileMetadata;
import com.markdownviewer.entity.User;
import com.markdownviewer.repository.FileMetadataRepository;
import com.markdownviewer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 파일 저장/조회 서비스
 * 사용자별 디렉토리(/users/{userId}/files/)에 파일 저장, 메타데이터는 DB 관리
 * @see 03_API_SPECIFICATION.md - 파일 API
 * @see 04_DATABASE_DESIGN.md - file_metadata
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final UserRepository userRepository;

    @Value("${app.file-storage-base-path:./data}")
    private String basePath;

    private static final long MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
    private static final String ALLOWED_EXT = ".md";
    private static final String ALLOWED_EXT_ALT = ".markdown";

    private Path userDir(Long userId) {
        return Paths.get(basePath).resolve("users").resolve(userId.toString()).resolve("files");
    }

    /** path가 안전한 상대 경로인지 검증 (Path Traversal 방지) */
    private String sanitizePath(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("INVALID_PATH");
        }
        path = path.replace('\\', '/').trim();
        if (path.startsWith("/") || path.contains("..")) {
            throw new IllegalArgumentException("INVALID_PATH");
        }
        return path;
    }

    @Transactional(readOnly = true)
    public List<FileMetadata> listFiles(User user, String directoryPath) {
        List<FileMetadata> all = fileMetadataRepository.findByUserOrderByFileNameAsc(user);
        if (directoryPath == null || directoryPath.isBlank()) {
            return all;
        }
        String prefix = sanitizePath(directoryPath);
        if (!prefix.endsWith("/")) {
            prefix = prefix + "/";
        }
        String finalPrefix = prefix;
        return all.stream()
                .filter(f -> f.getFilePath().startsWith(finalPrefix))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<FileMetadata> getMetadata(User user, String filePath) {
        String path = sanitizePath(filePath);
        return fileMetadataRepository.findByUserAndFilePath(user, path);
    }

    /** 파일 내용 읽기 (디스크 + 메타데이터) */
    @Transactional(readOnly = true)
    public Optional<FileContentResult> readFile(User user, String filePath) {
        String path = sanitizePath(filePath);
        Optional<FileMetadata> metaOpt = fileMetadataRepository.findByUserAndFilePath(user, path);
        Path fullPath = userDir(user.getId()).resolve(path);
        if (!Files.isRegularFile(fullPath)) {
            return Optional.empty();
        }
        try {
            byte[] bytes = Files.readAllBytes(fullPath);
            String content = new String(bytes, StandardCharsets.UTF_8);
            FileMetadata meta = metaOpt.orElse(FileMetadata.builder()
                    .user(user)
                    .filePath(path)
                    .fileName(Paths.get(path).getFileName().toString())
                    .fileSize((long) bytes.length)
                    .encrypted(false)
                    .mimeType("text/markdown")
                    .lastModified(LocalDateTime.now())
                    .build());
            return Optional.of(FileContentResult.builder()
                    .metadata(meta)
                    .content(content)
                    .encrypted(Boolean.TRUE.equals(meta.getEncrypted()))
                    .encryptedData(meta.getIv() != null ? readEncryptedBytes(fullPath) : null)
                    .iv(meta.getIv())
                    .authTag(meta.getAuthTag())
                    .build());
        } catch (IOException e) {
            log.error("파일 읽기 실패: {}", fullPath, e);
            return Optional.empty();
        }
    }

    private String readEncryptedBytes(Path p) throws IOException {
        byte[] bytes = Files.readAllBytes(p);
        return java.util.Base64.getEncoder().encodeToString(bytes);
    }

    @Transactional
    public Optional<FileMetadata> saveFile(User user, String filePath, String content,
                                           boolean encrypted, String encryptedDataB64, String ivB64, String tagB64) {
        String path = sanitizePath(filePath);
        Path fullPath = userDir(user.getId()).resolve(path);
        try {
            Files.createDirectories(fullPath.getParent());
            byte[] toWrite = encrypted && encryptedDataB64 != null
                    ? java.util.Base64.getDecoder().decode(encryptedDataB64)
                    : content.getBytes(StandardCharsets.UTF_8);
            if (toWrite.length > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("FILE_TOO_LARGE");
            }
            Files.write(fullPath, toWrite, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            FileMetadata meta = fileMetadataRepository.findByUserAndFilePath(user, path)
                    .orElse(FileMetadata.builder()
                            .user(user)
                            .filePath(path)
                            .fileName(Paths.get(path).getFileName().toString())
                            .encrypted(false)
                            .mimeType("text/markdown")
                            .build());
            long oldSize = meta.getFileSize() != null ? meta.getFileSize() : 0L;
            long newSize = toWrite.length;
            meta.updateContent(newSize, LocalDateTime.now());
            if (encrypted && ivB64 != null && tagB64 != null) {
                meta.updateEncrypted(ivB64, tagB64);
            }
            meta = fileMetadataRepository.save(meta);

            User u = userRepository.findById(user.getId()).orElseThrow();
            u.addStorageUsed(newSize - oldSize);
            userRepository.save(u);
            return Optional.of(meta);
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", fullPath, e);
            return Optional.empty();
        }
    }

    @Transactional
    public Optional<FileMetadata> uploadFile(User user, MultipartFile file, String directoryPath) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return Optional.empty();
        }
        if (!originalName.endsWith(ALLOWED_EXT) && !originalName.endsWith(ALLOWED_EXT_ALT)) {
            throw new IllegalArgumentException("FILE_INVALID_FORMAT");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("FILE_TOO_LARGE");
        }
        String baseDir = (directoryPath != null && !directoryPath.isBlank()) ? sanitizePath(directoryPath) + "/" : "";
        String filePath = baseDir + originalName;
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            return saveFile(user, filePath, content, false, null, null, null);
        } catch (IOException e) {
            log.error("업로드 파일 읽기 실패", e);
            return Optional.empty();
        }
    }

    @Transactional
    public boolean deleteFile(User user, String filePath, boolean secure) {
        String path = sanitizePath(filePath);
        Optional<FileMetadata> metaOpt = fileMetadataRepository.findByUserAndFilePath(user, path);
        if (metaOpt.isEmpty()) {
            return false;
        }
        FileMetadata meta = metaOpt.get();
        Path fullPath = userDir(user.getId()).resolve(path);
        try {
            if (Files.exists(fullPath)) {
                if (secure) {
                    Files.write(fullPath, new byte[0], StandardOpenOption.TRUNCATE_EXISTING);
                    byte[] random = new byte[(int) Math.min(meta.getFileSize() != null ? meta.getFileSize() : 0, 1024 * 1024)];
                    new java.security.SecureRandom().nextBytes(random);
                    Files.write(fullPath, random, StandardOpenOption.TRUNCATE_EXISTING);
                }
                Files.delete(fullPath);
            }
            long size = meta.getFileSize() != null ? meta.getFileSize() : 0L;
            fileMetadataRepository.delete(meta);
            User u = userRepository.findById(user.getId()).orElseThrow();
            u.subtractStorageUsed(size);
            userRepository.save(u);
            return true;
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", fullPath, e);
            return false;
        }
    }

    @Transactional(readOnly = true)
    public Optional<FileMetadata> getLastModifiedFile(User user) {
        return fileMetadataRepository.findTopByUserOrderByLastModifiedDesc(user);
    }

    /** 읽기 결과 (내용 + 메타) */
    @lombok.Data
    @lombok.Builder
    public static class FileContentResult {
        private FileMetadata metadata;
        private String content;
        private boolean encrypted;
        private String encryptedData;
        private String iv;
        private String authTag;
    }
}
