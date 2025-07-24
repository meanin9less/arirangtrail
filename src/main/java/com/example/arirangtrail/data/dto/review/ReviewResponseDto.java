// src/main/java/com/example/arirangtrail/data/dto/ReviewResponseDto.java
package com.example.arirangtrail.data.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal; // BigDecimal 임포트
import java.time.Instant; // Instant 임포트
import java.time.LocalDate; // LocalDate 임포트
import java.time.ZoneId; // Instant to LocalDateTime 변환을 위해 추가 (필요시)
import java.time.format.DateTimeFormatter; // 날짜 포맷팅을 위해 추가 (필요시)
import java.util.List; // ReviewPhotoResponseDto 목록을 위해 추가

/**
 * 리뷰 사진 정보를 위한 DTO입니다.
 * ReviewEntity의 reviewphotos 연관 관계에 매핑됩니다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewPhotoResponseDto {
    private Long photoId; // ReviewphotoEntity의 id 타입에 맞춰 Long
    private String imageUrl; // 이미지 URL
    private String caption; // 이미지 캡션
}

/**
 * 프론트엔드로 전송될 리뷰 데이터를 정의하는 DTO입니다.
 * ReviewEntity의 필드 타입에 맞춰 수정되었습니다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDto {
    private Long reviewid; // 리뷰 ID (Long 타입)
    private String username; // 작성자 ID
    private Long contentid; // 축제/관광지 ID (Long 타입)
    private String contenttitle; // 축제/관광지 제목
    private String title; // 리뷰 제목
    private String content; // 리뷰 내용
    private BigDecimal rating; // 별점 (BigDecimal 타입)
    private LocalDate visitdate; // 방문일 (LocalDate 타입)
    private Instant createdat; // 생성일 (Instant 타입)
    private Instant updatedat; // 수정일 (Instant 타입)
    private List<ReviewPhotoResponseDto> photos; // 리뷰 사진 목록

    /**
     * Instant 타입을 "yyyy-MM-dd HH:mm:ss" 형식의 문자열로 변환합니다.
     * 프론트엔드에서 날짜/시간 표시를 편리하게 하기 위한 헬퍼 메서드입니다.
     * @return 포맷팅된 생성일 문자열
     */
    public String getFormattedCreatedAt() {
        return createdat != null ? createdat.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;
    }

    /**
     * Instant 타입을 "yyyy-MM-dd HH:mm:ss" 형식의 문자열로 변환합니다.
     * 프론트엔드에서 날짜/시간 표시를 편리하게 하기 위한 헬퍼 메서드입니다.
     * @return 포맷팅된 수정일 문자열
     */
    public String getFormattedUpdatedAt() {
        return updatedat != null ? updatedat.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;
    }
}
