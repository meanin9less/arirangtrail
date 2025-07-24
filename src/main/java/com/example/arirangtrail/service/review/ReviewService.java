package com.example.arirangtrail.service.review;

import com.example.arirangtrail.component.review.FileStore;
import com.example.arirangtrail.data.dto.review.ReviewCreateRequestDto;
import com.example.arirangtrail.data.dto.review.ReviewResponseDto; // ✨ 추가: ReviewResponseDto 임포트
import com.example.arirangtrail.data.dto.review.ReviewUpdateRequestDto;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.entity.ReviewphotoEntity;
import com.example.arirangtrail.data.repository.ReviewRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final FileStore fileStore;

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

        reviewEntity.setCreatedat(Instant.now());
        reviewEntity.setUpdatedat(Instant.now());

        if (photoFiles != null && !photoFiles.isEmpty()) {
            List<String> photoUrls = fileStore.storeFiles(photoFiles);
            List<ReviewphotoEntity> reviewPhotos = photoUrls.stream()
                    .map(url -> {
                        ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                        newPhoto.setImageurl(url);
                        newPhoto.setCreatedat(Instant.now());
                        return newPhoto;
                    })
                    .collect(Collectors.toList());

            reviewEntity.changePhotos(reviewPhotos);
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
            Set<ReviewphotoEntity> oldPhotos = reviewEntity.getReviewphotos();
            if (oldPhotos != null && !oldPhotos.isEmpty()) {
                oldPhotos.forEach(photo -> fileStore.deleteFile(photo.getImageurl()));
            }

            List<String> newPhotoUrls = fileStore.storeFiles(newPhotoFiles);

            List<ReviewphotoEntity> newReviewPhotos = newPhotoUrls.stream()
                    .map(url -> {
                        ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                        newPhoto.setImageurl(url);
                        newPhoto.setCreatedat(Instant.now());
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

        Set<ReviewphotoEntity> photos = reviewEntity.getReviewphotos();
        if (photos != null && !photos.isEmpty()) {
            photos.forEach(photo -> fileStore.deleteFile(photo.getImageurl()));
        }

        reviewRepository.delete(reviewEntity);
    }

    // ✨ ✨ ✨ 추가: 모든 리뷰 조회 메서드 ✨ ✨ ✨
    public List<ReviewResponseDto> getAllReviews() {
        // 모든 리뷰 엔티티를 조회하고, 각 엔티티를 DTO로 변환합니다.
        return reviewRepository.findAll().stream()
                .map(ReviewResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ✨ ✨ ✨ 추가: 단일 리뷰 조회 메서드 (reviewId로) ✨ ✨ ✨
    public ReviewResponseDto getReviewById(Long reviewId) {
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다. ID: " + reviewId));
        return ReviewResponseDto.fromEntity(reviewEntity);
    }
}
