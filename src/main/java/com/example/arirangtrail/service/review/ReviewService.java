package com.example.arirangtrail.service.review;

import com.example.arirangtrail.component.review.FileStore;
import com.example.arirangtrail.data.dto.PaginationDto;
import com.example.arirangtrail.data.dto.review.*;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.entity.ReviewphotoEntity;
import com.example.arirangtrail.data.repository.ReviewRepository;
import com.example.arirangtrail.data.repository.ReviewphotoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional; // Spring의 @Transactional 임포트

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
//@Profile("prod")
@RequiredArgsConstructor
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final ReviewphotoRepository reviewphotoRepository;
    private final FileStore fileStore;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Transactional
    public ReviewEntity createReview(ReviewCreateRequestDto createDto, List<MultipartFile> photoFiles) throws IOException {
        ReviewEntity reviewEntity = ReviewEntity.builder()
                .username(createDto.getUsername())
                .contentid(createDto.getContentid())
                .contenttitle(createDto.getContenttitle())
                .title(createDto.getTitle())
                .content(createDto.getContent())
                .rating(createDto.getRating())
                .visitdate(createDto.getVisitdate())
                .build();

        ReviewEntity savedReview = reviewRepository.save(reviewEntity);

        if (photoFiles != null && !photoFiles.isEmpty()) {
            log.info("createReview: 업로드할 파일 개수: {}", photoFiles.size());

            List<String> photoUrls = fileStore.storeFiles(photoFiles, bucket);

            log.info("createReview: S3에 업로드된 URL 개수: {}", photoUrls.size());
            photoUrls.forEach(url -> log.info("createReview: 업로드된 URL: {}", url));

            List<ReviewphotoEntity> reviewPhotos = photoUrls.stream()
                    .map(url -> {
                        ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                        newPhoto.setImageurl(url);
                        newPhoto.setReview(savedReview);
                        return newPhoto;
                    })
                    .collect(Collectors.toList());

            savedReview.changePhotos(reviewPhotos);
            log.info("createReview: ReviewEntity에 사진 {}개가 설정되었습니다.", reviewPhotos.size());
        } else {
            log.info("createReview: 업로드할 파일이 없습니다.");
        }
        return savedReview;
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

        if (newPhotoFiles != null) {
            List<ReviewphotoEntity> oldPhotos = reviewEntity.getReviewphotos();
            if (oldPhotos != null && !oldPhotos.isEmpty()) {
                oldPhotos.forEach(photo -> fileStore.deleteFile(photo.getImageurl(), bucket));
            }

            if (!newPhotoFiles.isEmpty()) {
                List<String> newPhotoUrls = fileStore.storeFiles(newPhotoFiles, bucket);
                List<ReviewphotoEntity> newReviewPhotos = newPhotoUrls.stream()
                        .map(url -> {
                            ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                            newPhoto.setImageurl(url);
                            newPhoto.setReview(reviewEntity);
                            return newPhoto;
                        })
                        .collect(Collectors.toList());
                reviewEntity.changePhotos(newReviewPhotos);
            } else {
                reviewEntity.changePhotos(new ArrayList<>());
            }
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

    public ReviewListResponseDto getAllReviews(Pageable pageable) {
        Page<ReviewEntity> reviewPage = reviewRepository.findAll(pageable);
        Page<ReviewResponseDto> reviewDtoPage = reviewPage.map(this::convertToDto);

        return new ReviewListResponseDto(
                reviewDtoPage.getContent(),
                new PaginationDto(reviewDtoPage)
        );
    }

    public ReviewResponseDto getReviewById(Long reviewId) {
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with ID: " + reviewId));
        return convertToDto(reviewEntity);
    }

    /**
     * 특정 username이 작성한 모든 리뷰를 조회합니다.
     *
     * @param username 조회할 사용자의 username
     * @return 해당 사용자가 작성한 리뷰 목록 DTO
     */
    @Transactional(readOnly = true) // 읽기 전용 트랜잭션으로 설정하여 성능 최적화
    public List<ReviewResponseDto> getReviewsByUsername(String username) {
        List<ReviewEntity> reviewEntities = reviewRepository.findByUsernameOrderByCreatedatDesc(username);
        return reviewEntities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Double findAverageRatingByContentid(Long contentid) {
        List<ReviewEntity> reviews = reviewRepository.findByContentid(contentid);

        if (reviews.isEmpty()) {
            return 0.0; // ⭐ 리뷰 없으면 0.0 반환
        }

        // 평점 평균 계산
        double average = reviews.stream()
                .mapToDouble(r -> r.getRating().doubleValue())
                .average()
                .orElse(0.0); // fallback (사실상 위 isEmpty 조건으로 인해 여기엔 안 옴)

        return average;
    }
    private ReviewResponseDto convertToDto(ReviewEntity entity) {
        List<ReviewPhotoResponseDto> photos = (entity.getReviewphotos() != null) ?
                entity.getReviewphotos().stream()
                        .map(photoEntity -> ReviewPhotoResponseDto.builder()
                                .photoId(photoEntity.getId())
                                .photoUrl(photoEntity.getImageurl())
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        return ReviewResponseDto.builder()
                .reviewId(entity.getId())
                .username(entity.getUsername())
                .contentId(entity.getContentid())
                .contentTitle(entity.getContenttitle())
                .title(entity.getTitle())
                .content(entity.getContent())
                .rating(entity.getRating())
                .visitDate(entity.getVisitdate())
                .createdAt(entity.getCreatedat())
                .updatedAt(entity.getUpdatedat())
                .photos(photos)
                .build();
    }
}
