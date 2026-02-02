package com.markdownviewer.dto.response;

import com.markdownviewer.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 인증 응답 DTO
 * 
 * @see 03_API_SPECIFICATION.md - 인증 API 응답 형식
 * @see 12_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (DTO)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private UserDto user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String email;
        private String name;
        private String pictureUrl;
        private Long storageQuota;
        private Long storageUsed;
        private String createdAt;

        public static UserDto from(User user) {
            return UserDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .pictureUrl(user.getPictureUrl())
                    .storageQuota(user.getStorageQuota())
                    .storageUsed(user.getStorageUsed())
                    .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                    .build();
        }
    }
}
