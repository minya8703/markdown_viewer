package com.markdownviewer.controller;

import com.markdownviewer.dto.response.ApiResponse;
import com.markdownviewer.dto.response.AuthResponse;
import com.markdownviewer.entity.User;
import com.markdownviewer.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 인증 컨트롤러
 * Google OAuth 로그인 처리
 * 
 * @see docs/10_design/10_SYSTEM_ARCHITECTURE.md - AuthController 상세 설계
 * @see docs/20_backend/20_API_SPECIFICATION.md - 인증 API 엔드포인트 명세
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (Controller)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Google 로그인 시작
     * GET /api/auth/google/login
     * Spring Security OAuth2가 자동으로 Google OAuth URL로 리다이렉트
     */
    @GetMapping("/google/login")
    public ResponseEntity<Void> googleLogin() {
        // Spring Security OAuth2가 자동으로 처리
        // SecurityConfig에서 설정된 redirect-uri로 리다이렉트
        return ResponseEntity.status(HttpStatus.FOUND).build();
    }

    /**
     * Google OAuth 콜백 처리
     * GET /api/auth/google/callback
     * OAuth2 인증 성공 후 JWT 토큰 발급 및 프론트엔드로 리다이렉트
     */
    @GetMapping("/google/callback")
    public ResponseEntity<Void> googleCallback(@AuthenticationPrincipal OAuth2User oauth2User) {
        try {
            // Google 사용자 정보 추출
            Map<String, Object> attributes = oauth2User.getAttributes();
            String googleSub = (String) attributes.get("sub");

            // 사용자 조회
            User user = authService.findByGoogleSub(googleSub);

            // JWT 토큰 생성
            String token = authService.generateToken(user.getId());

            // 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
            String redirectUrl = String.format("%s/auth/google/callback?token=%s", frontendUrl, token);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();
        } catch (Exception e) {
            log.error("Google OAuth 콜백 처리 실패", e);
            String errorUrl = String.format("%s/login?error=authentication_failed", frontendUrl);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", errorUrl)
                    .build();
        }
    }

    /**
     * 현재 사용자 정보 조회
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("AUTH_REQUIRED", "인증이 필요합니다."));
            }
            String token = authorizationHeader.replace("Bearer ", "").trim();
            Long userId = authService.getUserIdFromToken(token);
            User user = authService.findById(userId);
            return ResponseEntity.ok(ApiResponse.success(AuthResponse.UserDto.from(user)));
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("AUTH_INVALID", "인증이 필요합니다."));
        }
    }

    /**
     * 로그아웃
     * POST /api/auth/logout
     * Authorization: Bearer &lt;token&gt; 으로 전달된 토큰을 블랙리스트에 등록하여 만료 시점까지 재사용 불가
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.replace("Bearer ", "").trim();
            authService.logout(token);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "로그아웃되었습니다."));
    }
}
