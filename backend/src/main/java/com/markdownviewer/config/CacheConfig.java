package com.markdownviewer.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.List;

/**
 * 캐시 설정
 * - Redis 사용 시: RedisCacheManager (REDIS_ENABLED=true, Redis 자동구성 활성화 시)
 * - Redis 미사용 시: ConcurrentMapCacheManager (기본)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    @ConditionalOnBean(RedisConnectionFactory.class)
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }

    @Bean
    @ConditionalOnMissingBean(RedisConnectionFactory.class)
    public CacheManager inMemoryCacheManager() {
        org.springframework.cache.concurrent.ConcurrentMapCacheManager manager =
                new org.springframework.cache.concurrent.ConcurrentMapCacheManager();
        manager.setCacheNames(List.of("fileMetadata"));
        return manager;
    }
}
