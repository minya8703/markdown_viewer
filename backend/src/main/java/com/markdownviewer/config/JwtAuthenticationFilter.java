package com.markdownviewer.config;

import com.markdownviewer.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 인증 필터
 * Authorization: Bearer &lt;token&gt; 검증 후 SecurityContext 설정
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (StringUtils.hasText(token)) {
                Long userId = authService.getUserIdFromToken(token);
                JwtPrincipal principal = new JwtPrincipal(userId);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.debug("JWT 검증 실패: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7).trim();
        }
        return null;
    }

    /**
     * JWT 인증 시 사용하는 Principal (userId 보관)
     */
    public static class JwtPrincipal {
        private final Long userId;

        public JwtPrincipal(Long userId) {
            this.userId = userId;
        }

        public Long getUserId() {
            return userId;
        }
    }
}
