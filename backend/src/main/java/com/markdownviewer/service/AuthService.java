package com.markdownviewer.service;

import com.markdownviewer.entity.User;
import com.markdownviewer.repository.UserRepository;
import com.markdownviewer.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 인증 서비스
 * Google OAuth 인증 처리 및 사용자 관리
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - AuthService 상세 설계
 * @see 12_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (Service)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    /**
     * OAuth2 사용자 정보 로드 및 사용자 생성/업데이트
     */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        // Google 사용자 정보 추출
        Map<String, Object> attributes = oauth2User.getAttributes();
        String googleSub = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String pictureUrl = (String) attributes.get("picture");

        // 사용자 생성 또는 업데이트
        User user = createOrUpdateUser(googleSub, email, name, pictureUrl);

        return oauth2User;
    }

    /**
     * 사용자 생성 또는 업데이트
     */
    @Transactional
    public User createOrUpdateUser(String googleSub, String email, String name, String pictureUrl) {
        User user = userRepository.findByGoogleSub(googleSub)
                .orElseGet(() -> {
                    // 새 사용자 생성
                    User newUser = User.builder()
                            .googleSub(googleSub)
                            .email(email)
                            .name(name)
                            .pictureUrl(pictureUrl)
                            .build();
                    log.info("새 사용자 생성: {}", email);
                    return userRepository.save(newUser);
                });

        // 기존 사용자 정보 업데이트
        user.updateFromGoogle(name, pictureUrl);
        user.updateLastLogin();
        userRepository.save(user);

        return user;
    }

    /**
     * Google Sub로 사용자 조회
     */
    @Transactional(readOnly = true)
    public User findByGoogleSub(String googleSub) {
        return userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + googleSub));
    }

    /**
     * 사용자 ID로 JWT 토큰 생성
     */
    public String generateToken(Long userId) {
        return jwtUtil.generateToken(userId);
    }

    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    public Long getUserIdFromToken(String token) {
        return jwtUtil.getUserIdFromToken(token);
    }

    /**
     * JWT 토큰 유효성 검증
     */
    public Boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }
}
