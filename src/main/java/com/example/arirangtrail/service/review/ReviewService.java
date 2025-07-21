package com.example.arirangtrail.service.review;

import com.example.arirangtrail.component.review.FileStore;
import com.example.arirangtrail.data.dto.review.ReviewCreateRequestDto;
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
        // 1. DTO를 기반으로 새로운 ReviewEntity 객체를 생성합니다.
        ReviewEntity reviewEntity = new ReviewEntity();
        reviewEntity.setUsername(createDto.getUsername());
        reviewEntity.setContentid(createDto.getContentid());
        reviewEntity.setContenttitle(createDto.getContenttitle());
        reviewEntity.setTitle(createDto.getTitle());
        reviewEntity.setContent(createDto.getContent());
        reviewEntity.setRating(createDto.getRating());
        reviewEntity.setVisitdate(createDto.getVisitdate());

        // createdat, updatedat 필드는 엔티티에 @PrePersist를 사용하거나 DB 기본값으로 자동 설정하는 것이 좋지만,
        // 수동으로 설정한다면 다음과 같이 할 수 있습니다.
        reviewEntity.setCreatedat(Instant.now());
        reviewEntity.setUpdatedat(Instant.now());


        // 2. 새로운 사진 파일들을 업로드하고 ReviewphotoEntity 리스트를 생성합니다.
        if (photoFiles != null && !photoFiles.isEmpty()) {
            List<String> photoUrls = fileStore.storeFiles(photoFiles);
            List<ReviewphotoEntity> reviewPhotos = photoUrls.stream()
                    .map(url -> {
                        ReviewphotoEntity newPhoto = new ReviewphotoEntity();
                        newPhoto.setImageurl(url);
                        newPhoto.setCreatedat(Instant.now());
                        // 부모-자식 관계 설정은 편의 메소드에서 처리
                        return newPhoto;
                    })
                    .collect(Collectors.toList());

            // 3. (핵심) ReviewEntity의 편의 메소드를 호출하여 사진 목록을 설정합니다.
            //    이때 자식(photo)에게 부모(review)가 누구인지도 함께 설정됩니다.
            reviewEntity.changePhotos(reviewPhotos); // 수정 시 사용했던 편의 메소드 재활용
        }

        // 4. (저장) 완성된 ReviewEntity를 저장합니다.
        //    CascadeType.ALL 옵션 덕분에 reviewEntity를 저장하면 reviewPhotos도 함께 저장됩니다.
        return reviewRepository.save(reviewEntity);
    }

    @Transactional
    // ⭐ 파라미터가 DTO와 파일 목록으로 단순해짐
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

            // 3-4. ReviewEntity의 편의 메소드를 호출하여 사진 목록을 완전히 교체
            reviewEntity.changePhotos(newReviewPhotos);
        }
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        // 1. 리뷰 엔티티를 조회합니다. 존재하지 않으면 예외를 발생시킵니다.
        ReviewEntity reviewEntity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다. ID: " + reviewId));

        // 2. (핵심) 데이터베이스에서 삭제하기 전에, 서버에 저장된 물리적인 파일을 먼저 삭제합니다.
        //    그렇지 않으면 DB 레코드는 사라지고 파일만 남는 "고아 파일"이 됩니다.
        Set<ReviewphotoEntity> photos = reviewEntity.getReviewphotos();
        if (photos != null && !photos.isEmpty()) {
            photos.forEach(photo -> fileStore.deleteFile(photo.getImageurl()));
        }

        // 3. 리뷰를 삭제합니다.
        //    cascade 설정에 의해 이 리뷰에 연결된 reviewphotos 레코드도 DB에서 함께 삭제됩니다.
        reviewRepository.delete(reviewEntity);
    }
}