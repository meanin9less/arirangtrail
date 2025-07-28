package com.example.arirangtrail.data.dto.festival;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor // 모든 필드를 받는 생성자 자동 생성
public class LikeStatusDTO {
    @JsonProperty("isLiked")
    private boolean isLiked;
    private long likeCount;
}