package com.example.arirangtrail.data.dto.review;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ReviewUpdateRequestDto {
    // 식별자인 ID를 DTO에 포함
    private Long reviewId;
    // 클라이언트가 수정할 수 있는 필드
    private String title;
    private String content;
    private BigDecimal rating;
    private LocalDate visitdate;
}