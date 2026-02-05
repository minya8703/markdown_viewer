package com.markdownviewer.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * JWT 블랙리스트 - 인메모리 구현 (Redis 미사용 시)
 * 토큰 만료 시점(expireAt)까지 보관 후 조회 시 만료된 항목은 제거
 */
@Service
@ConditionalOnMissingBean(RedisConnectionFactory.class)
@Slf4j
public class InMemoryJwtBlacklistService implements JwtBlacklistService {

    /** token -> 만료 시점(epoch ms) */
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    @Override
    public void add(String token, long ttlMs) {
        if (token == null || ttlMs <= 0) return;
        long expireAt = System.currentTimeMillis() + ttlMs;
        blacklist.put(token, expireAt);
        log.debug("JWT 블랙리스트 추가 (인메모리), 만료: {} ms 후", ttlMs);
    }

    @Override
    public boolean contains(String token) {
        if (token == null) return false;
        Long expireAt = blacklist.get(token);
        if (expireAt == null) return false;
        if (System.currentTimeMillis() >= expireAt) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }
}
