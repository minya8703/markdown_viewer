package com.markdownviewer.controller;

import com.markdownviewer.config.JwtAuthenticationFilter;
import com.markdownviewer.entity.FileMetadata;
import com.markdownviewer.entity.User;
import com.markdownviewer.service.AuthService;
import com.markdownviewer.service.FileService;
import com.markdownviewer.service.JwtBlacklistService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FileController 단위 테스트
 * 파일 목록/읽기/저장/삭제 API 검증 (인증 컨텍스트 모킹)
 */
@WebMvcTest(controllers = FileController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@TestPropertySource(properties = {"app.frontend-url=http://localhost:5173", "app.file-storage-base-path=./data/test"})
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FileService fileService;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtBlacklistService jwtBlacklistService;

    private User user;

    @BeforeEach
    void setUp() {
        JwtAuthenticationFilter.JwtPrincipal principal = new JwtAuthenticationFilter.JwtPrincipal(1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));

        user = User.builder()
                .id(1L)
                .googleSub("sub-1")
                .email("test@example.com")
                .name("Test User")
                .storageQuota(1073741824L)
                .storageUsed(0L)
                .createdAt(LocalDateTime.now())
                .build();
        when(authService.findById(1L)).thenReturn(user);
    }

    @Test
    @DisplayName("GET /files - 200 및 files 배열 반환")
    void listFiles_returns200WithFiles() throws Exception {
        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("doc.md")
                .fileName("doc.md")
                .fileSize(100L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileService.listFiles(eq(user), eq(null))).thenReturn(List.of(meta));

        mockMvc.perform(get("/files")
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.files").isArray())
                .andExpect(jsonPath("$.data.files[0].path").value("doc.md"));
    }

    @Test
    @DisplayName("GET /files?path=dir - path 파라미터로 필터 조회")
    void listFiles_withPath_returnsFiltered() throws Exception {
        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("dir/sub.md")
                .fileName("sub.md")
                .fileSize(50L)
                .lastModified(LocalDateTime.now())
                .build();
        when(fileService.listFiles(eq(user), eq("dir"))).thenReturn(List.of(meta));

        mockMvc.perform(get("/files").param("path", "dir")
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.files[0].path").value("dir/sub.md"));
    }

    @Test
    @DisplayName("GET /files/{path}/check - 304 Not Modified (동일 lastModified)")
    void checkFileModified_sameModified_returns304() throws Exception {
        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("a.md")
                .fileName("a.md")
                .lastModified(LocalDateTime.of(2026, 2, 2, 12, 0, 0))
                .build();
        when(fileService.getMetadata(eq(user), eq("a.md"))).thenReturn(Optional.of(meta));

        mockMvc.perform(get("/files/a.md/check")
                        .header("Authorization", "Bearer dummy-token")
                        .header("If-Modified-Since", "2026-02-02T12:00:00"))
                .andExpect(status().isNotModified());
    }

    @Test
    @DisplayName("GET /files/{path}/check - 200 (변경됨)")
    void checkFileModified_changed_returns200() throws Exception {
        FileMetadata meta = FileMetadata.builder()
                .user(user)
                .filePath("b.md")
                .fileName("b.md")
                .lastModified(LocalDateTime.of(2026, 2, 2, 14, 0, 0))
                .build();
        when(fileService.getMetadata(eq(user), eq("b.md"))).thenReturn(Optional.of(meta));

        mockMvc.perform(get("/files/b.md/check")
                        .header("Authorization", "Bearer dummy-token")
                        .header("If-Modified-Since", "2026-02-02T12:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastModified").exists());
    }

    @Test
    @DisplayName("DELETE /files/{path} - 200 및 성공 메시지")
    void deleteFile_returns200() throws Exception {
        when(fileService.deleteFile(eq(user), eq("remove.md"), eq(false))).thenReturn(true);

        mockMvc.perform(delete("/files/remove.md").with(csrf())
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("파일이 삭제되었습니다."));
    }

    @Test
    @DisplayName("DELETE /files/{path}?secure=true - 안전 삭제 200")
    void deleteFile_secure_returns200() throws Exception {
        when(fileService.deleteFile(eq(user), eq("secure.md"), eq(true))).thenReturn(true);

        mockMvc.perform(delete("/files/secure.md").param("secure", "true").with(csrf())
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /files/{path} - 파일 없으면 404")
    void deleteFile_notFound_returns404() throws Exception {
        when(fileService.deleteFile(eq(user), eq("missing.md"), eq(false))).thenReturn(false);

        mockMvc.perform(delete("/files/missing.md").with(csrf())
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
