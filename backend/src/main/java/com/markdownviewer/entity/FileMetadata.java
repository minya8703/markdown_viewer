package com.markdownviewer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 파일 메타데이터 엔티티
 * @see docs/30_db/30_DATABASE_DESIGN.md - file_metadata 테이블 설계
 */
@Entity
@Table(name = "file_metadata", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "file_path"})
}, indexes = {
    @Index(columnList = "user_id"),
    @Index(columnList = "user_id, last_modified"),
    @Index(columnList = "user_id, encrypted")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "encrypted", nullable = false)
    @Builder.Default
    private Boolean encrypted = false;

    @Column(name = "iv", length = 255)
    private String iv;

    @Column(name = "auth_tag", length = 255)
    private String authTag;

    @Column(name = "mime_type", length = 100)
    @Builder.Default
    private String mimeType = "text/markdown";

    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public void updateContent(long fileSize, LocalDateTime lastModified) {
        this.fileSize = fileSize;
        this.lastModified = lastModified;
    }

    public void updateEncrypted(String iv, String authTag) {
        this.encrypted = true;
        this.iv = iv;
        this.authTag = authTag;
    }
}
