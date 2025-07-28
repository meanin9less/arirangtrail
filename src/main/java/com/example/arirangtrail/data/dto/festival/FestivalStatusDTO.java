package com.example.arirangtrail.data.dto.festival;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FestivalStatusDTO {
    private long likeCount;
    private long shareCount;
    @JsonProperty("isLiked")
    private boolean isLiked; // 현재 사용자의 좋아요 여부
}