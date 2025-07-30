package com.example.arirangtrail.controller.review;

import com.example.arirangtrail.data.dto.review.*;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.repository.ReviewCommentRepository;
import com.example.arirangtrail.service.review.ReviewCommentService;
import com.example.arirangtrail.service.review.ReviewService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal; // ✨ 추가: Principal 임포트
import java.util.List;
import java.util.Map;

//잠시 꺼놓기
@RestController
@Profile("prod") // "prod" 프로필이 활성화될 때만 이 빈(Bean)을 생성하라는 의미!
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewCommentService reviewCommentService;

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

    // 모든 리뷰 조회 엔드포인트
    @GetMapping
    public ResponseEntity<ReviewListResponseDto> getAllReviews(
            @PageableDefault(size = 20, sort = "createdat", direction = Sort.Direction.DESC) Pageable pageable) {
        ReviewListResponseDto reviewListResponse = reviewService.getAllReviews(pageable);
        return ResponseEntity.ok(reviewListResponse);
    }

    // 단일 리뷰 조회 엔드포인트
    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDto> getReviewById(@PathVariable Long reviewId) {
        try {
            ReviewResponseDto review = reviewService.getReviewById(reviewId);
            return ResponseEntity.ok(review);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); // 404 Not Found
        }
    }

    // ✨ ✨ ✨ 추가: 현재 로그인한 사용자의 리뷰 목록 조회 엔드포인트 ✨ ✨ ✨
    @GetMapping("/my")
    public ResponseEntity<List<ReviewResponseDto>> getMyReviews(Principal principal) {
        // Principal 객체는 Spring Security를 통해 현재 인증된 사용자 정보를 제공합니다.
        // principal.getName()은 일반적으로 사용자 ID (여기서는 username)를 반환합니다.
        if (principal == null || principal.getName() == null) {
            // 인증되지 않은 사용자 요청 시 401 Unauthorized 반환
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String username = principal.getName();
        List<ReviewResponseDto> myReviews = reviewService.getReviewsByUsername(username);
        return ResponseEntity.ok(myReviews);
    }

    @GetMapping("/rating/{contentid}")
    public ResponseEntity<Double> getAverageRatingByContentid(@PathVariable Long contentid) {
        // 이 메서드는 ReviewService에 findAverageRatingByContentid 메서드가 있다고 가정합니다.
        // 해당 서비스 메서드가 없으면 오류가 발생할 수 있습니다.
        // 예시: return ResponseEntity.ok(this.reviewService.findAverageRatingByContentid(contentid));
        // 현재 ReviewService에는 findAverageRatingByContentid 메서드가 없으므로,
        // 이 부분은 ReviewService에 해당 로직을 추가하거나, 이 엔드포인트가 필요 없으면 삭제해야 합니다.
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(null); // 임시로 501 Not Implemented 반환
    }

    @GetMapping("/{reviewid}/comments")
    public ResponseEntity<List<ReviewCommentDTO>> reviewCommentsByReviewid(@PathVariable Long reviewid) {
        List<ReviewCommentDTO> commentDTOList = this.reviewCommentService.getReviewCommentsByReviewId(reviewid);
        return ResponseEntity.ok(commentDTOList);
    }

    @PostMapping("/{reviewid}/comments")
    public ResponseEntity<?> createComment(@PathVariable Long reviewid, ReviewCommentDTO reviewCommentDTO){
        boolean result = this.reviewCommentService.createReviewComment(reviewid, reviewCommentDTO);
        if (result) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

}
