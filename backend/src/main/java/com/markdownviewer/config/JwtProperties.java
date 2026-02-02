package com.markdownviewer.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT 설정 Properties
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - JWT 토큰 설정
 * @see 12_CODING_CONVENTIONS.md - 백엔드 코딩 규약 (Configuration)
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    /**
     * JWT 서명에 사용할 Secret Key
     */
    private String secret;

    /**
     * JWT 토큰 만료 시간 (밀리초)
     */
    private Long expiration;
}
