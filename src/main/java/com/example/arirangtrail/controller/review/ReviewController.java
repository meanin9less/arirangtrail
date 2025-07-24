// src/main/java/com/example/arirangtrail/controller/ReviewController.java
package com.example.arirangtrail.controller.review;

import com.example.arirangtrail.data.dto.ReviewResponseDto;
import com.example.arirangtrail.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // PathVariable 임포트
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 리뷰 관련 HTTP 요청을 처리하는 REST 컨트롤러입니다.
 * 클라이언트의 요청을 받아 ReviewService로 전달하고, 결과를 HTTP 응답으로 반환합니다.
 */
@RestController
@RequestMapping("/api/reviews") // 모든 리뷰 관련 요청은 /api/reviews 경로로 매핑됩니다.
@RequiredArgsConstructor // ReviewService를 자동으로 주입받기 위한 Lombok 어노테이션
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * 모든 리뷰 목록을 조회하는 GET 요청을 처리합니다.
     * 경로: GET /api/reviews
     * @return 모든 리뷰의 ReviewResponseDto 목록을 포함하는 ResponseEntity
     */
    @GetMapping
    public ResponseEntity<List<ReviewResponseDto>> getAllReviews() {
        List<ReviewResponseDto> reviews = reviewService.getAllReviews(); // 서비스에서 모든 리뷰 조회
        return ResponseEntity.ok(reviews); // HTTP 200 OK와 함께 리뷰 목록 반환
    }

    /**
     * 특정 ID를 가진 리뷰를 조회하는 GET 요청을 처리합니다.
     * 경로: GET /api/reviews/{reviewId}
     * @param reviewId 조회할 리뷰의 ID (URL 경로 변수)
     * @return 해당 ID에 해당하는 ReviewResponseDto를 포함하는 ResponseEntity
     */
    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDto> getReviewById(@PathVariable Long reviewId) { // reviewId를 Long 타입으로 받습니다.
        ReviewResponseDto review = reviewService.getReviewById(reviewId); // 서비스에서 특정 리뷰 조회
        return ResponseEntity.ok(review); // HTTP 200 OK와 함께 단일 리뷰 반환
    }
}
