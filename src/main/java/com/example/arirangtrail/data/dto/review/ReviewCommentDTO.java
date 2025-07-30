package com.example.arirangtrail.data.dto.review;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ReviewCommentDTO {
    private Long commentid;
    private Long reviewid;
    private String content;
    private String username;
    private String nickname;
    private Instant createdat;
    private Instant updatedat;
}
