// src/main/java/com/example/arirangtrail/service/ReviewService.java
package com.example.arirangtrail.service;

import com.example.arirangtrail.data.dto.review.ReviewPhotoResponseDto; // ReviewPhotoResponseDto 임포트
import com.example.arirangtrail.data.dto.ReviewResponseDto;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 리뷰 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.
 * ReviewRepository를 통해 데이터에 접근하고, Entity를 DTO로 변환하여 반환합니다.
 */
@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성하여 의존성 주입을 처리합니다.
public class ReviewService {

    private final ReviewRepository reviewRepository;

    /**
     * 모든 리뷰 목록을 조회하여 DTO 형태로 반환합니다.
     * @return 모든 리뷰의 ReviewResponseDto 목록
     */
    public List<ReviewResponseDto> getAllReviews() {
        List<ReviewEntity> reviews = reviewRepository.findAll(); // 모든 ReviewEntity 조회
        return reviews.stream()
                .map(this::convertToDto) // 각 Entity를 DTO로 변환
                .collect(Collectors.toList()); // DTO 목록으로 수집
    }

    /**
     * 특정 ID를 가진 리뷰를 조회하여 DTO 형태로 반환합니다.
     * @param reviewId 조회할 리뷰의 ID (Long 타입)
     * @return 해당 ID에 해당하는 ReviewResponseDto
     * @throws RuntimeException 리뷰를 찾을 수 없을 경우 발생
     */
    public ReviewResponseDto getReviewById(Long reviewId) {
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId) // ID로 ReviewEntity 조회
                .orElseThrow(() -> new RuntimeException("Review not found with ID: " + reviewId)); // 없으면 예외 발생
        return convertToDto(reviewEntity); // 조회된 Entity를 DTO로 변환
    }

    /**
     * ReviewEntity를 ReviewResponseDto로 변환하는 헬퍼 메서드입니다.
     * 엔티티의 필드 타입에 맞춰 DTO 필드에 값을 매핑합니다.
     * @param entity 변환할 ReviewEntity
     * @return 변환된 ReviewResponseDto
     */
    private ReviewResponseDto convertToDto(ReviewEntity entity) {
        // ReviewphotoEntity 목록을 ReviewPhotoResponseDto 목록으로 변환합니다.
        List<ReviewPhotoResponseDto> photos = entity.getReviewphotos().stream()
                .map(photoEntity -> ReviewPhotoResponseDto.builder()
                        .photoId(photoEntity.getId())
                        .imageUrl(photoEntity.getImageurl())
                        .caption(photoEntity.getCaption())
                        .build())
                .collect(Collectors.toList());

        return ReviewResponseDto.builder()
                .reviewid(entity.getId()) // Long 타입
                .username(entity.getUsername())
                .contentid(entity.getContentid()) // Long 타입
                .contenttitle(entity.getContenttitle())
                .title(entity.getTitle())
                .content(entity.getContent())
                .rating(entity.getRating()) // BigDecimal 타입
                .visitdate(entity.getVisitdate()) // LocalDate 타입
                .createdat(entity.getCreatedat()) // Instant 타입
                .updatedat(entity.getUpdatedat()) // Instant 타입
                .photos(photos) // 변환된 사진 목록 추가
                .build();
    }
}
