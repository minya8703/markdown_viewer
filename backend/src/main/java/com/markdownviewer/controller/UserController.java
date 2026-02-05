package com.markdownviewer.controller;

import com.markdownviewer.config.JwtAuthenticationFilter;
import com.markdownviewer.dto.response.ApiResponse;
import com.markdownviewer.entity.FileMetadata;
import com.markdownviewer.entity.User;
import com.markdownviewer.service.AuthService;
import com.markdownviewer.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 사용자 API 컨트롤러 (마지막 문서 등)
 * @see docs/20_backend/20_API_SPECIFICATION.md - GET /api/users/me/last-document
 */
@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final FileService fileService;
    private final AuthService authService;

    private User currentUser() {
        JwtAuthenticationFilter.JwtPrincipal principal = (JwtAuthenticationFilter.JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return authService.findById(principal.getUserId());
    }

    /** GET /api/users/me/last-document */
    @GetMapping("/last-document")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLastDocument() {
        try {
            User user = currentUser();
            Optional<FileMetadata> last = fileService.getLastModifiedFile(user);
            if (last.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("FILE_NOT_FOUND", "마지막 문서가 없습니다."));
            }
            FileMetadata m = last.get();
            Map<String, Object> data = new HashMap<>();
            data.put("path", m.getFilePath());
            data.put("name", m.getFileName());
            data.put("lastModified", m.getLastModified() != null ? m.getLastModified().toString() : null);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("마지막 문서 조회 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }
}
