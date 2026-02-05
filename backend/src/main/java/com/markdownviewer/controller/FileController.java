package com.markdownviewer.controller;

import com.markdownviewer.config.JwtAuthenticationFilter;
import com.markdownviewer.dto.request.FileSaveRequest;
import com.markdownviewer.dto.response.ApiResponse;
import com.markdownviewer.dto.response.FileResponse;
import com.markdownviewer.entity.FileMetadata;
import com.markdownviewer.entity.User;
import com.markdownviewer.service.AuthService;
import com.markdownviewer.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 파일 API 컨트롤러
 * @see docs/20_backend/20_API_SPECIFICATION.md - 파일 API
 */
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileService fileService;
    private final AuthService authService;

    private User currentUser() {
        JwtAuthenticationFilter.JwtPrincipal principal = (JwtAuthenticationFilter.JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return authService.findById(principal.getUserId());
    }

    /** GET /api/files?path=... */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<FileResponse>>>> listFiles(
            @RequestParam(required = false) String path
    ) {
        try {
            User user = currentUser();
            List<FileMetadata> list = fileService.listFiles(user, path);
            List<FileResponse> files = list.stream()
                    .map(FileResponse::fromMetadata)
                    .collect(Collectors.toList());
            Map<String, List<FileResponse>> data = new HashMap<>();
            data.put("files", files);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("파일 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }

    /** GET /api/files/{path}/check - 파일 변경 여부 확인 (탭 복귀 시 변경 감지용) */
    @GetMapping("/{path:.+}/check")
    public ResponseEntity<?> checkFileModified(
            @PathVariable String path,
            @RequestHeader(value = "If-Modified-Since", required = false) String ifModifiedSince
    ) {
        try {
            String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8);
            User user = currentUser();
            Optional<FileMetadata> metaOpt = fileService.getMetadata(user, decodedPath);
            if (metaOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("FILE_NOT_FOUND", "파일을 찾을 수 없습니다."));
            }
            FileMetadata meta = metaOpt.get();
            String lastModifiedStr = meta.getLastModified() != null
                    ? meta.getLastModified().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    : null;

            if (ifModifiedSince != null && !ifModifiedSince.isBlank() && lastModifiedStr != null
                    && lastModifiedStr.equals(ifModifiedSince.trim())) {
                return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
            }

            Map<String, String> data = new HashMap<>();
            data.put("path", meta.getFilePath());
            if (lastModifiedStr != null) {
                data.put("lastModified", lastModifiedStr);
            }
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("INVALID_PATH", e.getMessage()));
        } catch (Exception e) {
            log.error("파일 변경 확인 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }

    /** GET /api/files/{path} */
    @GetMapping("/{path:.+}")
    public ResponseEntity<ApiResponse<FileResponse>> getFile(@PathVariable String path) {
        try {
            String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8);
            User user = currentUser();
            Optional<FileService.FileContentResult> result = fileService.readFile(user, decodedPath);
            if (result.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("FILE_NOT_FOUND", "파일을 찾을 수 없습니다."));
            }
            FileService.FileContentResult r = result.get();
            FileResponse resp = FileResponse.builder()
                    .path(r.getMetadata().getFilePath())
                    .name(r.getMetadata().getFileName())
                    .type("file")
                    .size(r.getMetadata().getFileSize())
                    .encrypted(r.isEncrypted())
                    .content(r.isEncrypted() ? null : r.getContent())
                    .encryptedData(r.getEncryptedData())
                    .iv(r.getIv())
                    .tag(r.getAuthTag())
                    .lastModified(r.getMetadata().getLastModified())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(resp));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("INVALID_PATH", e.getMessage()));
        } catch (Exception e) {
            log.error("파일 읽기 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }

    /** POST /api/files/{path} */
    @PostMapping("/{path:.+}")
    public ResponseEntity<ApiResponse<FileResponse>> saveFile(
            @PathVariable String path,
            @RequestBody FileSaveRequest body
    ) {
        try {
            String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8);
            User user = currentUser();
            boolean encrypted = Boolean.TRUE.equals(body.getEncrypted());
            Optional<FileMetadata> meta = fileService.saveFile(
                    user, decodedPath,
                    body.getContent(),
                    encrypted,
                    body.getEncryptedData(),
                    body.getIv(),
                    body.getTag()
            );
            if (meta.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.error("SERVER_ERROR", "저장에 실패했습니다."));
            }
            return ResponseEntity.ok(ApiResponse.success(FileResponse.fromMetadata(meta.get()), "파일이 저장되었습니다."));
        } catch (IllegalArgumentException e) {
            String code = "INVALID_PATH";
            if ("FILE_TOO_LARGE".equals(e.getMessage())) {
                code = "FILE_TOO_LARGE";
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(code, e.getMessage()));
        } catch (Exception e) {
            log.error("파일 저장 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }

    /** POST /api/files/upload */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String path
    ) {
        try {
            User user = currentUser();
            Optional<FileMetadata> meta = fileService.uploadFile(user, file, path);
            if (meta.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("FILE_INVALID_FORMAT", "지원하지 않는 파일 형식입니다."));
            }
            return ResponseEntity.ok(ApiResponse.success(FileResponse.fromMetadata(meta.get()), "파일이 업로드되었습니다."));
        } catch (IllegalArgumentException e) {
            HttpStatus status = "FILE_TOO_LARGE".equals(e.getMessage()) ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status)
                    .body(ApiResponse.error(e.getMessage(), e.getMessage()));
        } catch (Exception e) {
            log.error("파일 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }

    /** DELETE /api/files/{path}?secure=... */
    @DeleteMapping("/{path:.+}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable String path,
            @RequestParam(required = false, defaultValue = "false") boolean secure
    ) {
        try {
            String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8);
            User user = currentUser();
            boolean deleted = fileService.deleteFile(user, decodedPath, secure);
            if (!deleted) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("FILE_NOT_FOUND", "파일을 찾을 수 없습니다."));
            }
            return ResponseEntity.ok(ApiResponse.success(null, "파일이 삭제되었습니다."));
        } catch (Exception e) {
            log.error("파일 삭제 실패", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FILE_ACCESS_DENIED", e.getMessage()));
        }
    }
}
