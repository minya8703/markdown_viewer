package com.markdownviewer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자 엔티티
 * Google OAuth 사용자 정보 저장
 * 
 * @see 04_DATABASE_DESIGN.md - users 테이블 설계
 * @see 12_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (엔티티)
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_google_sub", columnList = "google_sub"),
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_last_login", columnList = "last_login_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "google_sub", unique = true, nullable = false, length = 255)
    private String googleSub;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "picture_url", columnDefinition = "TEXT")
    private String pictureUrl;

    @Column(name = "storage_quota", nullable = false)
    @Builder.Default
    private Long storageQuota = 1073741824L; // 1GB 기본 할당량

    @Column(name = "storage_used", nullable = false)
    @Builder.Default
    private Long storageUsed = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /**
     * 마지막 로그인 시간 업데이트
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    /**
     * 사용자 정보 업데이트 (Google OAuth 정보)
     */
    public void updateFromGoogle(String name, String pictureUrl) {
        this.name = name;
        this.pictureUrl = pictureUrl;
    }
}
