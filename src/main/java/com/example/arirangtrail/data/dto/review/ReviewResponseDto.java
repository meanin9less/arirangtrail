// src/main/java/com/example/arirangtrail/data/dto/review/ReviewResponseDto.java
package com.example.arirangtrail.data.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 리뷰 응답을 위한 DTO 클래스입니다.
 * 클라이언트에게 리뷰 정보를 전달할 때 사용됩니다.
 */
@Getter // 모든 필드에 대한 getter 메서드를 자동으로 생성합니다.
@Setter // 모든 필드에 대한 setter 메서드를 자동으로 생성합니다.
@NoArgsConstructor // 인자 없는 기본 생성자를 자동으로 생성합니다.
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자를 자동으로 생성합니다.
@Builder // 빌더 패턴을 사용하여 객체를 생성할 수 있도록 합니다.
public class ReviewResponseDto {
    private Long reviewId; // 리뷰 ID
    private String username; // 사용자 이름
    private Long contentId; // 콘텐츠 ID (예: 아리랑 트레일 코스 ID)
    private String contentTitle; // 콘텐츠 제목 (예: 아리랑 트레일 코스 이름)
    private String title; // 리뷰 제목
    private String content; // 리뷰 내용
    private BigDecimal rating; // 평점 (예: 1.0 ~ 5.0)
    private LocalDate visitDate; // 방문일
    private LocalDateTime createdAt; // 생성일시
    private LocalDateTime updatedAt; // 수정일시
    private List<ReviewPhotoResponseDto> photos; // 리뷰 사진 목록 (분리된 DTO 사용)
}
