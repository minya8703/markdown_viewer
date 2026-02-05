package com.markdownviewer.service;

import com.markdownviewer.config.JwtProperties;
import com.markdownviewer.entity.User;
import com.markdownviewer.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final JwtProperties jwtProperties;
    private final JwtBlacklistService jwtBlacklistService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Google에서 사용자 정보를 가져오는 기본 로직 위임
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        return delegate.loadUser(userRequest);
    }

    /**
     * 사용자 생성 또는 업데이트 (회원가입/로그인 로직)
     */
    @Transactional
    public User createOrUpdateUser(String googleSub, String email, String name, String pictureUrl) {
        return userRepository.findByGoogleSub(googleSub)
                .map(user -> {
                    // 1. 이미 존재하는 사용자 -> 정보 업데이트 (로그인)
                    log.info("기존 사용자 로그인: {}", email);
                    user.update(name, pictureUrl);
                    return user;
                })
                .orElseGet(() -> {
                    // 2. 존재하지 않는 사용자 -> 새로 생성 (회원가입)
                    log.info("새로운 사용자 회원가입: {}", email);
                    User newUser = User.builder()
                            .googleSub(googleSub)
                            .email(email)
                            .name(name)
                            .pictureUrl(pictureUrl)
                            .lastLoginAt(LocalDateTime.now())
                            .build();
                    return userRepository.save(newUser);
                });
    }

    /**
     * 사용자 ID로 조회
     */
    @Transactional(readOnly = true)
    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));
    }

    /**
     * Google Sub로 사용자 조회
     */
    @Transactional(readOnly = true)
    public User findByGoogleSub(String googleSub) {
        return userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));
    }

    /**
     * JWT 토큰 생성
     */
    public String generateToken(Long userId) {
        long now = System.currentTimeMillis();
        SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + jwtProperties.getExpiration()))
                .signWith(key)
                .compact();
    }
    
    public Long getUserIdFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
        String subject = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Long.parseLong(subject);
    }

    /**
     * JWT exp 클레임까지 남은 시간(밀리초). 이미 만료되었으면 0 또는 작은 값.
     */
    public long getTtlMsFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
        Claims payload = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Date exp = payload.getExpiration();
        if (exp == null) return jwtProperties.getExpiration();
        long ttlMs = exp.getTime() - System.currentTimeMillis();
        return Math.max(ttlMs, 0);
    }

    /**
     * 로그아웃: 해당 토큰을 블랙리스트에 넣어 만료 시점까지 재사용 불가
     * 토큰이 유효하지 않거나 만료된 경우 무시 (200 응답 유지)
     */
    public void logout(String token) {
        if (token == null || !StringUtils.hasText(token)) return;
        try {
            long ttlMs = getTtlMsFromToken(token);
            jwtBlacklistService.add(token, ttlMs);
        } catch (Exception e) {
            log.debug("로그아웃 시 토큰 파싱 실패(무시): {}", e.getMessage());
        }
    }
}
