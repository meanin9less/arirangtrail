package com.example.arirangtrail.controller.review;

import com.example.arirangtrail.data.dto.review.ReviewCreateRequestDto;
import com.example.arirangtrail.data.dto.review.ReviewResponseDto; // ✨ 추가: ReviewResponseDto 임포트
import com.example.arirangtrail.data.dto.review.ReviewUpdateRequestDto;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.service.review.ReviewService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map; // Map 임포트

//@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<String> createReview(
            @RequestPart("createRequest") ReviewCreateRequestDto createDto,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photoFiles) {

        try {
            ReviewEntity createdReview = reviewService.createReview(createDto, photoFiles);
            return ResponseEntity.status(HttpStatus.CREATED).body("리뷰가 성공적으로 작성되었습니다. ID: " + createdReview.getId());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("파일 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PutMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<String> updateReview(
            @RequestPart("updateRequest") ReviewUpdateRequestDto updateDto,
            @RequestPart(value = "photos", required = false) List<MultipartFile> newPhotoFiles) {

        try {
            reviewService.updateReview(updateDto, newPhotoFiles);
            return ResponseEntity.ok("리뷰가 성공적으로 수정되었습니다.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("파일 처리 중 오류가 발생했습니다.");
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<String> deleteReview(@PathVariable Long reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok("리뷰(ID: " + reviewId + ")가 성공적으로 삭제되었습니다.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("리뷰 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // ✨ ✨ ✨ 추가: 모든 리뷰 조회 엔드포인트 ✨ ✨ ✨
    @GetMapping
    public ResponseEntity<Map<String, List<ReviewResponseDto>>> getAllReviews() {
        List<ReviewResponseDto> reviews = reviewService.getAllReviews();
        // 프론트엔드의 GetReviewsResponse 인터페이스에 맞춰 "reviews" 키로 묶어서 반환
        return ResponseEntity.ok(Map.of("reviews", reviews));
    }

    // ✨ ✨ ✨ 추가: 단일 리뷰 조회 엔드포인트 ✨ ✨ ✨
    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDto> getReviewById(@PathVariable Long reviewId) {
        try {
            ReviewResponseDto review = reviewService.getReviewById(reviewId);
            return ResponseEntity.ok(review);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); // 404 Not Found
        }
    }
}
