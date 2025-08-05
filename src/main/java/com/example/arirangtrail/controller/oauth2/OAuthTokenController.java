package com.example.arirangtrail.controller.oauth2;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// controller/oauth2/OAuthTokenController.java
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/oauth")
public class OAuthTokenController {
    private final RedisTemplate<String, Object> redisTemplate;

    @PostMapping("/token")

    public ResponseEntity<?> getTokenByCode(@RequestBody Map<String, String> requestBody) {
        String code = requestBody.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body("Code is missing.");
        }

        String redisKey = "oauth-code:" + code;
        Map<String, Object> tokenData = (Map<String, Object>) redisTemplate.opsForValue().get(redisKey);

        if (tokenData == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired code.");
        }

        // 사용된 코드는 즉시 삭제
        redisTemplate.delete(redisKey);

        return ResponseEntity.ok(tokenData);
    }
}