package com.markdownviewer.config;

import com.markdownviewer.entity.User;
import com.markdownviewer.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Spring Security 설정
 * OAuth2 및 JWT 인증 설정
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - SecurityConfig 상세 설계
 * @see 12_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (Configuration)
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final AuthService authService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .csrf(csrf -> csrf.disable()) // OAuth2 콜백을 위해 CSRF 비활성화
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // JWT 사용으로 세션 비활성화
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/oauth2/**", "/login/oauth2/code/**", "/auth/**").permitAll()
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                // 기본 콜백 경로 사용: /login/oauth2/code/google (redirect_uri와 일치해야 함)
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(authService)
                )
                .successHandler(createOAuth2SuccessHandler())
                .failureHandler((request, response, exception) -> {
                    // OAuth2 로그인 실패 처리
                    // 프론트엔드 로그인 페이지로 리다이렉트
                    log.error("OAuth2 로그인 실패", exception);
                    String errorUrl = String.format("%s/login?error=%s", frontendUrl, 
                        exception.getMessage() != null ? exception.getMessage() : "authentication_failed");
                    try {
                        response.sendRedirect(errorUrl);
                    } catch (IOException e) {
                        log.error("리다이렉트 실패", e);
                    }
                })
            );

        return http.build();
    }

    /**
     * OAuth2 성공 핸들러 생성
     * 인증 성공 시 JWT 토큰 생성 및 프론트엔드로 리다이렉트
     */
    private AuthenticationSuccessHandler createOAuth2SuccessHandler() {
        return (request, response, authentication) -> {
            try {
                // OAuth2User 추출
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                Map<String, Object> attributes = oauth2User.getAttributes();
                String googleSub = (String) attributes.get("sub");
                String email = (String) attributes.get("email");
                String name = (String) attributes.get("name");
                String pictureUrl = (String) attributes.get("picture");

                log.info("OAuth2 로그인 성공: googleSub={}, email={}", googleSub, email);

                // 사용자 생성 또는 업데이트
                User user = authService.createOrUpdateUser(googleSub, email, name, pictureUrl);

                // JWT 토큰 생성
                String token = authService.generateToken(user.getId());
                log.info("JWT 토큰 생성 완료: userId={}", user.getId());

                // 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
                String redirectUrl = String.format("%s/auth/google/callback?token=%s", frontendUrl, token);
                response.sendRedirect(redirectUrl);
            } catch (Exception e) {
                log.error("OAuth2 성공 핸들러 처리 실패", e);
                String errorUrl = String.format("%s/login?error=authentication_failed", frontendUrl);
                try {
                    response.sendRedirect(errorUrl);
                } catch (IOException ioException) {
                    log.error("리다이렉트 실패", ioException);
                }
            }
        };
    }

    /**
     * CORS 설정
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        )); // 프론트엔드 URL (Vite 기본 5173, CRA 3000)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
