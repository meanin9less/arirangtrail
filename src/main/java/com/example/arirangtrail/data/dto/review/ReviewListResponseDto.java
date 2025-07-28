package com.example.arirangtrail.data.dto.review;

import com.example.arirangtrail.data.dto.PaginationDto;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ReviewListResponseDto {
    private List<ReviewResponseDto> reviews;
    private PaginationDto pagination;

    public ReviewListResponseDto(List<ReviewResponseDto> reviews, PaginationDto pagination) {
        this.reviews = reviews;
        this.pagination = pagination;
    }
}
