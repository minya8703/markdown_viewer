package com.markdownviewer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * JWT 블랙리스트 - Redis 구현 (Redis 사용 시)
 * 키: jwt:blacklist:{token}, TTL = 토큰 만료까지 남은 시간
 */
@Service
@ConditionalOnBean(RedisConnectionFactory.class)
@RequiredArgsConstructor
@Slf4j
public class RedisJwtBlacklistService implements JwtBlacklistService {

    private static final String KEY_PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;

    @Override
    public void add(String token, long ttlMs) {
        if (token == null || ttlMs <= 0) return;
        String key = KEY_PREFIX + token;
        Duration ttl = Duration.ofMillis(ttlMs);
        redisTemplate.opsForValue().set(key, "1", ttl);
        log.debug("JWT 블랙리스트 추가 (Redis), TTL: {} ms", ttlMs);
    }

    @Override
    public boolean contains(String token) {
        if (token == null) return false;
        String key = KEY_PREFIX + token;
        Boolean has = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(has);
    }
}
