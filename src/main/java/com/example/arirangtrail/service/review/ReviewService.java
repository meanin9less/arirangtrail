package com.example.arirangtrail.service.review;

import com.example.arirangtrail.component.review.FileStore;
import com.example.arirangtrail.data.dto.PaginationDto;
import com.example.arirangtrail.data.dto.review.*;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.entity.ReviewphotoEntity;
import com.example.arirangtrail.data.repository.ReviewRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
//import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//잠시 주석처리
@Service
//@Profile("prod") // "prod" 프로필이 활성화될 때만 이 빈(Bean)을 생성하라는 의미!
@RequiredArgsConstructor
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class); // 로거 추가

    private final ReviewRepository reviewRepository;
    private final FileStore fileStore;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Transactional
    public ReviewEntity createReview(ReviewCreateRequestDto createDto, List<MultipartFile> photoFiles) throws IOException {
        ReviewEntity reviewEntity = new ReviewEntity();
        reviewEntity.setUsername(createDto.getUsername());
        reviewEntity.setContentid(createDto.getContentid());
        reviewEntity.setContenttitle(createDto.getContenttitle());
        reviewEntity.setTitle(createDto.getTitle());
        reviewEntity.setContent(createDto.getContent());
        reviewEntity.setRating(createDto.getRating());
        reviewEntity.setVisitdate(createDto.getVisitdate());

//        reviewEntity.setCreatedat(Instant.now());
//        reviewEntity.setUpdatedat(Instant.now());

        if (photoFiles != null && !photoFiles.isEmpty()) {
            log.info("createReview: 업로드할 파일 개수: {}", photoFiles.size()); // 로그 추가

            List<String> photoUrls = fileStore.storeFiles(photoFiles, bucket);

            log.info("createReview: S3에 업로드된 URL 개수: {}", photoUrls.size()); // 로그 추가
            photoUrls.forEach(url -> log.info("createReview: 업로드된 URL: {}", url)); // 로그 추가

            List<ReviewphotoEntity> reviewPhotos = photoUrls.stream()
                    .map(url -> {
                        ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                        newPhoto.setImageurl(url);
                        return newPhoto;
                    })
                    .collect(Collectors.toList());

            reviewEntity.changePhotos(reviewPhotos);
            log.info("createReview: ReviewEntity에 사진 {}개가 설정되었습니다.", reviewPhotos.size()); // 로그 추가
        } else {
            log.info("createReview: 업로드할 파일이 없습니다."); // 로그 추가
        }
        return reviewRepository.save(reviewEntity);
    }

    @Transactional
    public void updateReview(ReviewUpdateRequestDto updateDto, List<MultipartFile> newPhotoFiles) throws IOException {
        Long reviewId = updateDto.getReviewId();
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다. ID: " + reviewId));

        reviewEntity.setTitle(updateDto.getTitle());
        reviewEntity.setContent(updateDto.getContent());
        reviewEntity.setRating(updateDto.getRating());
        reviewEntity.setVisitdate(updateDto.getVisitdate());

        if (newPhotoFiles != null && !newPhotoFiles.isEmpty()) {
            List<ReviewphotoEntity> oldPhotos = reviewEntity.getReviewphotos();
            if (oldPhotos != null && !oldPhotos.isEmpty()) {
                oldPhotos.forEach(photo -> fileStore.deleteFile(photo.getImageurl(), bucket));
            }

            List<String> newPhotoUrls = fileStore.storeFiles(newPhotoFiles, bucket);

            List<ReviewphotoEntity> newReviewPhotos = newPhotoUrls.stream()
                    .map(url -> {
                        ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                        newPhoto.setImageurl(url);
                        return newPhoto;
                    })
                    .collect(Collectors.toList());

            reviewEntity.changePhotos(newReviewPhotos);
        }
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다. ID: " + reviewId));

        List<ReviewphotoEntity> photos = reviewEntity.getReviewphotos();
        if (photos != null && !photos.isEmpty()) {
            photos.forEach(photo -> fileStore.deleteFile(photo.getImageurl(), bucket));
        }

        reviewRepository.delete(reviewEntity);
    }

    // ✨ ✨ ✨ 추가: 모든 리뷰 조회 메서드 ✨ ✨ ✨
    public ReviewListResponseDto getAllReviews(Pageable pageable) {
        Page<ReviewEntity> reviewPage = reviewRepository.findAll(pageable);
        Page<ReviewResponseDto> reviewDtoPage = reviewPage.map(this::convertToDto);

        return new ReviewListResponseDto(
                reviewDtoPage.getContent(),
                new PaginationDto(reviewDtoPage)
        );
    }

    public ReviewResponseDto getReviewById(Long reviewId) {
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId) // ID로 ReviewEntity 조회
                .orElseThrow(() -> new RuntimeException("Review not found with ID: " + reviewId)); // 없으면 예외 발생
        return convertToDto(reviewEntity); // 조회된 Entity를 DTO로 변환
    }


    private ReviewResponseDto convertToDto(ReviewEntity entity) {
        // ReviewphotoEntity 목록을 ReviewPhotoResponseDto 목록으로 변환합니다.
        List<ReviewPhotoResponseDto> photos = entity.getReviewphotos().stream()
                .map(photoEntity -> ReviewPhotoResponseDto.builder()
                        .photoId(photoEntity.getId())
                        .photoUrl(photoEntity.getImageurl())
                        .build())
                .collect(Collectors.toList());

        return ReviewResponseDto.builder()
                .reviewId(entity.getId()) // Long 타입
                .username(entity.getUsername())
                .contentId(entity.getContentid()) // Long 타입
                .contentTitle(entity.getContenttitle())
                .title(entity.getTitle())
                .content(entity.getContent())
                .rating(entity.getRating()) // BigDecimal 타입
                .visitDate(entity.getVisitdate()) // LocalDate 타입
                .createdAt(entity.getCreatedat()) // LocalDate 타입
                .updatedAt(entity.getUpdatedat()) // LocalDate 타입
                .photos(photos) // 변환된 사진 목록 추가
                .build();
    }
}
