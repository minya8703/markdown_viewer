package com.markdownviewer.dto.response;

import com.markdownviewer.entity.FileMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 파일 API 응답 DTO
 * @see 03_API_SPECIFICATION.md - 파일 API 응답 형식
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {

    private String path;
    private String name;
    private String type;  // "file" | "directory"
    private Long size;
    private Boolean encrypted;
    private String content;
    private String html;
    private String encryptedData;
    private String iv;
    private String tag;
    private LocalDateTime lastModified;

    public static FileResponse fromMetadata(FileMetadata m) {
        return FileResponse.builder()
                .path(m.getFilePath())
                .name(m.getFileName())
                .type("file")
                .size(m.getFileSize())
                .encrypted(Boolean.TRUE.equals(m.getEncrypted()))
                .lastModified(m.getLastModified())
                .build();
    }
}
