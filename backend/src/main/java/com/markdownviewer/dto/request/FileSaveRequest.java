package com.markdownviewer.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 파일 저장 요청 DTO
 * @see 03_API_SPECIFICATION.md - POST /api/files/{path}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileSaveRequest {

    private String content;
    private Boolean encrypted;
    private String encryptedData;  // Base64
    private String iv;             // Base64
    private String tag;            // Base64 auth tag
}
