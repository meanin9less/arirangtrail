package com.example.arirangtrail.controller.redis;

import com.example.arirangtrail.service.redis.VisitorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/visitors")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorService visitorService;

    // 만약 백엔 api 요청만으로 데일리 카운트를 셀 때 쓰이는 용도
//    @GetMapping("/count/daily")
//    public ResponseEntity<Map<String, Long>> getDailyVisitorCount() {
//        Long count = visitorService.getDailyVisitorCount();
//        // 프론트에서 다루기 쉽게 JSON 객체로 감싸서 반환
//        return ResponseEntity.ok(Map.of("count", count));
//    }

    @GetMapping("/track-and-get-count")
    public ResponseEntity<Map<String, Object>> trackAndGetDailyCount(HttpServletRequest request, HttpServletResponse response) {
        Long count = 0L;
        boolean recordSuccess = false;
        boolean countSuccess = false;
        StringBuilder errorMessages = new StringBuilder();

        // 1️⃣ 방문자 기록 시도
        try {
            visitorService.recordVisitor(request, response);
            recordSuccess = true;
            log.info("✅ 방문자 기록 성공");
        } catch (Exception e) {
            log.error("❌ 방문자 기록 실패", e);
            errorMessages.append("방문자 기록 실패: ").append(e.getMessage());
        }

        // 2️⃣ 카운트 조회 시도 (독립적으로 실행)
        try {
            count = visitorService.getDailyVisitorCount();
            countSuccess = true;
            log.info("✅ 방문자 수 조회 성공: {}", count);
        } catch (Exception e) {
            log.error("❌ 방문자 수 조회 실패", e);
            if (errorMessages.length() > 0) {
                errorMessages.append(" | ");
            }
            errorMessages.append("카운트 조회 실패: ").append(e.getMessage());
            count = 0L;
        }

        // 3️⃣ 상태 결정
        String status;
        if (recordSuccess && countSuccess) {
            status = "success";
        } else if (!recordSuccess && countSuccess) {
            status = "record_failed";
        } else if (recordSuccess && !countSuccess) {
            status = "count_failed";
        } else {
            status = "all_failed";
        }

        // 4️⃣ 응답 데이터 구성
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("count", count);
        responseData.put("status", status);

        // 개발환경에서만 상세 정보 추가
        if (isDevEnvironment()) {
            responseData.put("recordSuccess", recordSuccess);
            responseData.put("countSuccess", countSuccess);
            responseData.put("error", errorMessages.length() > 0 ? errorMessages.toString() : null);
            responseData.put("timestamp", System.currentTimeMillis());
        }

        log.info("🏁 최종 결과 - status: {}, count: {}, errors: {}",
                status, count, errorMessages.toString());

        return ResponseEntity.ok(responseData);
    }

    // 별도 엔드포인트: 카운트만 조회 (방문 기록 없이)
    @GetMapping("/count-only")
    public ResponseEntity<Map<String, Long>> getCountOnly() {
        try {
            Long count = visitorService.getDailyVisitorCount();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("카운트 조회 실패", e);
            return ResponseEntity.ok(Map.of("count", 0L));
        }
    }

    private boolean isDevEnvironment() {
        String profile = System.getProperty("spring.profiles.active", "");
        return profile.contains("dev") || profile.contains("local");
    }


//    // 푸터에 넣고 페이지 로딩될때 마다 쿠키를 넣는 구조
//    @GetMapping("/track-and-get-count")
//    public ResponseEntity<Map<String, Long>> trackAndGetDailyCount(HttpServletRequest request, HttpServletResponse response) {
//        // 1. 서비스에 방문 기록을 먼저 요청합니다.
//        // 이 과정에서 쿠키가 없으면 생성되고, 응답 헤더에 Set-Cookie가 추가됩니다.
//        visitorService.recordVisitor(request, response);
//
//        // 2. 기록 후, 현재 총 방문자 수를 조회합니다.
//        Long count = visitorService.getDailyVisitorCount();
//
//        // 3. 조회한 숫자를 응답으로 보냅니다.
//        return ResponseEntity.ok(Map.of("count", count));
//    }
}