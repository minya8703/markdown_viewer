package com.markdownviewer.repository;

import com.markdownviewer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 사용자 Repository
 * 
 * @see 04_DATABASE_DESIGN.md - users 테이블 설계
 * @see 12_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (Repository)
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Google Sub로 사용자 조회
     */
    Optional<User> findByGoogleSub(String googleSub);

    /**
     * 이메일로 사용자 조회
     */
    Optional<User> findByEmail(String email);

    /**
     * Google Sub로 사용자 존재 여부 확인
     */
    boolean existsByGoogleSub(String googleSub);

    /**
     * 이메일로 사용자 존재 여부 확인
     */
    boolean existsByEmail(String email);
}
