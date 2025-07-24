// src/main/java/com/example/arirangtrail/data/dto/review/ReviewPhotoResponseDto.java
package com.example.arirangtrail.data.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 리뷰 사진 응답을 위한 DTO 클래스입니다.
 * 클라이언트에게 리뷰 사진 정보를 전달할 때 사용됩니다.
 */
@Getter // 모든 필드에 대한 getter 메서드를 자동으로 생성합니다.
@Setter // 모든 필드에 대한 setter 메서드를 자동으로 생성합니다.
@NoArgsConstructor // 인자 없는 기본 생성자를 자동으로 생성합니다.
@AllArgsConstructor // 모든 필드를 인자로 받는 생성자를 자동으로 생성합니다.
@Builder // 빌더 패턴을 사용하여 객체를 생성할 수 있도록 합니다.
public class ReviewPhotoResponseDto {
    private Long photoId; // 사진 ID
    private String photoUrl; // 사진 URL
}