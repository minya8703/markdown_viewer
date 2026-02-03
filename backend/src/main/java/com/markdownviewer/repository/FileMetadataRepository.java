package com.markdownviewer.repository;

import com.markdownviewer.entity.FileMetadata;
import com.markdownviewer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 파일 메타데이터 Repository
 * @see 04_DATABASE_DESIGN.md - file_metadata 테이블
 */
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {

    List<FileMetadata> findByUserOrderByFileNameAsc(User user);

    Optional<FileMetadata> findByUserAndFilePath(User user, String filePath);

    boolean existsByUserAndFilePath(User user, String filePath);

    Optional<FileMetadata> findTopByUserOrderByLastModifiedDesc(User user);
}
