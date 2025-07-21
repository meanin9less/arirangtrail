package com.example.arirangtrail.controller.test;

import com.example.arirangtrail.data.dto.test.RedisRequestDto;
import com.example.arirangtrail.service.test.RedisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/redis") // 공통 URL 경로 설정
public class RedisController {

    private final RedisService redisService;

    public RedisController(RedisService redisService) {
        this.redisService = redisService;
    }

    /**
     * Redis에 값을 저장하는 API
     * POST /api/redis/save
     */
    @PostMapping("/save")
    public ResponseEntity<String> saveValue(@RequestBody RedisRequestDto requestDto) {
        try {
            // DTO에서 받은 key와 value를 서비스로 전달합니다.
            // 예시로 5분(300초)의 만료 시간을 함께 설정합니다.
            redisService.setStringValueWithTimeout(requestDto.getKey(), requestDto.getValue(), 30000L);
            return ResponseEntity.ok("성공적으로 Redis에 저장되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("저장 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * Redis에서 값을 조회하는 API
     * GET /api/redis/get/{key}
     */
    @GetMapping("/get/{key}")
    public ResponseEntity<String> getValue(@PathVariable("key") String key) {
        String value = redisService.getStringValue(key);
        if (value != null) {
            return ResponseEntity.ok(value); // 값이 있으면 200 OK와 함께 값을 반환
        } else {
            return ResponseEntity.notFound().build(); // 값이 없으면 404 Not Found 응답
        }
    }

    /**
     * Redis에서 값을 삭제하는 API
     * DELETE /api/redis/delete/{key}
     */
    @DeleteMapping("/delete/{key}")
    public ResponseEntity<String> deleteValue(@PathVariable("key") String key) {
        redisService.deleteValue(key);
        return ResponseEntity.ok("성공적으로 Redis에서 삭제되었습니다.");
    }
}