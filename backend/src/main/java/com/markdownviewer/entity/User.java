package com.markdownviewer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "google_sub", unique = true, nullable = false)
    private String googleSub;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    @Column(name = "picture_url")
    private String pictureUrl;

    @Builder.Default
    @Column(name = "storage_quota")
    private Long storageQuota = 1073741824L; // 1GB 기본 할당

    @Builder.Default
    @Column(name = "storage_used")
    private Long storageUsed = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // 로그인 시 정보 업데이트
    public void update(String name, String pictureUrl) {
        this.name = name;
        this.pictureUrl = pictureUrl;
        this.lastLoginAt = LocalDateTime.now();
    }

    /** 저장 공간 사용량 증가 (파일 저장 시) */
    public void addStorageUsed(long delta) {
        this.storageUsed = (this.storageUsed != null ? this.storageUsed : 0L) + delta;
    }

    /** 저장 공간 사용량 감소 (파일 삭제 시) */
    public void subtractStorageUsed(long delta) {
        long current = this.storageUsed != null ? this.storageUsed : 0L;
        this.storageUsed = Math.max(0, current - delta);
    }
}
