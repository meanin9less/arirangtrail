// src/main/java/com/example/arirangtrail/data/dto/review/ReviewResponseDto.java
package com.example.arirangtrail.data.dto.review;

import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.entity.ReviewphotoEntity; // ReviewphotoEntity 임포트
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant; // Instant 임포트
import java.time.LocalDate; // LocalDate 임포트
import java.math.BigDecimal; // BigDecimal 임포트
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDto {
    private Long reviewid; // ReviewEntity의 id (Long)
    private String username;
    private Long contentid; // contentid (Long)
    private String contenttitle;
    private String title;
    private String content;
    private BigDecimal rating; // rating (BigDecimal)
    private LocalDate visitdate; // visitdate (LocalDate)
    private String imageurl; // ReviewphotoEntity에서 가져올 단일 이미지 URL
    private String caption; // ReviewphotoEntity에서 가져올 캡션
    private Instant createdat; // Instant로 변경
    private Instant updatedat; // Instant로 변경

    // ReviewEntity로부터 DTO를 생성하는 정적 팩토리 메서드
    public static ReviewResponseDto fromEntity(ReviewEntity reviewEntity) {
        String imageUrl = null;
        String caption = null;
        if (reviewEntity.getReviewphotos() != null && !reviewEntity.getReviewphotos().isEmpty()) {
            // Set을 List로 변환하여 첫 번째 요소에 접근
            ReviewphotoEntity firstPhoto = reviewEntity.getReviewphotos().stream().findFirst().orElse(null);
            if (firstPhoto != null) {
                imageUrl = firstPhoto.getImageurl();
                caption = firstPhoto.getCaption();
            }
        }

        return ReviewResponseDto.builder()
                .reviewid(reviewEntity.getId())
                .username(reviewEntity.getUsername())
                .contentid(reviewEntity.getContentid())
                .contenttitle(reviewEntity.getContenttitle())
                .title(reviewEntity.getTitle())
                .content(reviewEntity.getContent())
                .rating(reviewEntity.getRating())
                .visitdate(reviewEntity.getVisitdate())
                .imageurl(imageUrl)
                .caption(caption)
                .createdat(reviewEntity.getCreatedat())
                .updatedat(reviewEntity.getUpdatedat())
                .build();
    }
}