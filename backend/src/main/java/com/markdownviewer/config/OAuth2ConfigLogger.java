package com.markdownviewer.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * OAuth2 설정 로깅 컴포넌트
 * 애플리케이션 시작 시 OAuth2 설정값을 로그로 출력하여 확인
 */
@Component
@Slf4j
public class OAuth2ConfigLogger {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String redirectUri;

    @EventListener(ApplicationReadyEvent.class)
    public void logOAuth2Config() {
        log.info("=== OAuth2 Configuration ===");
        log.info("Google Client ID: {}", maskClientId(clientId));
        log.info("Google Client Secret: {}", maskSecret(clientSecret));
        log.info("Redirect URI: {}", redirectUri);
        log.info("===========================");
        
        // 환경 변수 확인
        String envClientId = System.getenv("GOOGLE_CLIENT_ID");
        String envClientSecret = System.getenv("GOOGLE_CLIENT_SECRET");
        
        log.info("Environment Variable GOOGLE_CLIENT_ID: {}", envClientId != null ? maskClientId(envClientId) : "NOT SET");
        log.info("Environment Variable GOOGLE_CLIENT_SECRET: {}", envClientSecret != null ? maskSecret(envClientSecret) : "NOT SET");
        
        // 값이 기본값인지 확인
        if (clientId.contains("your-google-client-id") || clientId.equals("your-google-client-id")) {
            log.error("WARNING: Google Client ID is using default value! Environment variable may not be loaded.");
        }
        if (clientSecret.contains("your-google-client-secret") || clientSecret.equals("your-google-client-secret")) {
            log.error("WARNING: Google Client Secret is using default value! Environment variable may not be loaded.");
        }
    }

    private String maskClientId(String clientId) {
        if (clientId == null || clientId.length() < 20) {
            return "***";
        }
        return clientId.substring(0, 10) + "..." + clientId.substring(clientId.length() - 10);
    }

    private String maskSecret(String secret) {
        if (secret == null || secret.length() < 10) {
            return "***";
        }
        return secret.substring(0, 6) + "***" + secret.substring(secret.length() - 4);
    }
}
