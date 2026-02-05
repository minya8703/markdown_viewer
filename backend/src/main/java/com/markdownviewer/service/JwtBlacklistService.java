package com.markdownviewer.service;

/**
 * JWT 블랙리스트 서비스 (로그아웃 시 토큰 무효화)
 * - Redis 사용 시: Redis에 TTL로 저장
 * - Redis 미사용 시: 인메모리 맵으로 저장
 */
public interface JwtBlacklistService {

    /**
     * 토큰을 블랙리스트에 추가 (토큰 만료 시점까지 유지)
     *
     * @param token   JWT 토큰
     * @param ttlMs   남은 유효 시간(밀리초). 토큰 만료 시점까지의 TTL
     */
    void add(String token, long ttlMs);

    /**
     * 토큰이 블랙리스트에 있는지 확인
     *
     * @param token JWT 토큰
     * @return 블랙리스트에 있으면 true
     */
    boolean contains(String token);
}
