package com.markdownviewer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공통 API 응답 DTO
 * 
 * @see docs/20_backend/20_API_SPECIFICATION.md - API 응답 형식
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (DTO)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private Boolean success;
    private T data;
    private String message;
    private ErrorDto error;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDto.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorDto {
        private String code;
        private String message;
        private Object details;
    }
}
