package com.markdownviewer.repository;

import com.markdownviewer.entity.User;
import com.markdownviewer.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 사용자 설정 Repository
 * @see 04_DATABASE_DESIGN.md - user_preferences 테이블
 */
public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    Optional<UserPreference> findByUser(User user);
}
