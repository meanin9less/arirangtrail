package com.example.arirangtrail.data.dto.review;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ReviewCreateRequestDto {
    // 작성에 필요한 필드들
    private String username;  // 또는 사용자 인증 정보에서 가져올 수도 있습니다.
    private Long contentid;   // 여행지 ID
    private String contenttitle;
    private String title;
    private String content;
    private BigDecimal rating;
    private LocalDate visitdate;
}