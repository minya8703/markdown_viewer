package com.markdownviewer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자 설정 엔티티
 * @see 04_DATABASE_DESIGN.md - user_preferences 테이블 설계
 */
@Entity
@Table(name = "user_preferences", uniqueConstraints = {
    @UniqueConstraint(columnNames = "user_id")
}, indexes = {
    @Index(columnList = "user_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "last_document_path", length = 1024)
    private String lastDocumentPath;

    @Column(name = "theme", length = 50)
    @Builder.Default
    private String theme = "light";

    @Column(name = "font_size")
    @Builder.Default
    private Integer fontSize = 16;

    @Column(name = "auto_save_interval")
    @Builder.Default
    private Integer autoSaveInterval = 180;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void updateLastDocumentPath(String path) {
        this.lastDocumentPath = path;
    }
}
