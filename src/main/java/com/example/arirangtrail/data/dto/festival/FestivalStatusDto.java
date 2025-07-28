package com.example.arirangtrail.data.dto.festival;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FestivalStatusDto {
    private long likeCount;
    private long shareCount;
    private boolean isLiked; // 현재 사용자의 좋아요 여부
}