package com.example.arirangtrail.service.test;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    /**
     * Redis에 키-값 쌍을 저장하는 메서드
     * @param key 저장할 데이터의 키
     * @param value 저장할 데이터의 값
     */
    public void setStringValue(String key, String value) {
        // opsForValue()는 Redis의 String 타입 데이터를 조작하는 데 사용됩니다.
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * Redis에 만료 시간을 설정하여 키-값 쌍을 저장하는 메서드
     * @param key 저장할 데이터의 키
     * @param value 저장할 데이터의 값
     * @param timeout 만료 시간 (단위: 초)
     */
    public void setStringValueWithTimeout(String key, String value, long timeout) {
        redisTemplate.opsForValue().set(key, value, timeout, TimeUnit.SECONDS);
    }

    /**
     * Redis에서 키에 해당하는 값을 조회하는 메서드
     * @param key 조회할 데이터의 키
     * @return 조회된 값 (키가 존재하지 않으면 null을 반환)
     */
    public String getStringValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Redis에서 키에 해당하는 데이터를 삭제하는 메서드
     * @param key 삭제할 데이터의 키
     */
    public void deleteValue(String key) {
        redisTemplate.delete(key);
    }
}