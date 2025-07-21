package com.example.arirangtrail.controller.review;


import com.example.arirangtrail.data.dto.review.ReviewCreateRequestDto;
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

@RestController
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


    // PUT 또는 PATCH 사용 가능
    @PutMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<String> updateReview(
            @RequestPart("updateRequest") ReviewUpdateRequestDto updateDto,
            @RequestPart(value = "photos", required = false) List<MultipartFile> newPhotoFiles) {

        try {
            // ⭐ 서비스 호출 시 DTO만 전달
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
            // (보안 참고) 실제 애플리케이션에서는 이 리뷰를 삭제할 권한이
            // 현재 로그인한 사용에게 있는지 확인하는 로직이 반드시 필요합니다.

            reviewService.deleteReview(reviewId);
            // 성공 시 200 OK와 함께 메시지를 반환하거나,
            // return ResponseEntity.noContent().build(); 처럼 204 No Content를 반환할 수 있습니다.
            return ResponseEntity.ok("리뷰(ID: " + reviewId + ")가 성공적으로 삭제되었습니다.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            // 그 외 예상치 못한 에러 처리
            return ResponseEntity.internalServerError().body("리뷰 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

}