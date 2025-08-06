package com.example.arirangtrail.controller.redis;

import com.example.arirangtrail.service.redis.VisitorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

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

    // 푸터에 넣고 페이지 로딩될때 마다 쿠키를 넣는 구조
    @GetMapping("/track-and-get-count")
    public ResponseEntity<Map<String, Long>> trackAndGetDailyCount(HttpServletRequest request, HttpServletResponse response) {
        // 1. 서비스에 방문 기록을 먼저 요청합니다.
        // 이 과정에서 쿠키가 없으면 생성되고, 응답 헤더에 Set-Cookie가 추가됩니다.
        visitorService.recordVisitor(request, response);

        // 2. 기록 후, 현재 총 방문자 수를 조회합니다.
        Long count = visitorService.getDailyVisitorCount();

        // 3. 조회한 숫자를 응답으로 보냅니다.
        return ResponseEntity.ok(Map.of("count", count));
    }

}