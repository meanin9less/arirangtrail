package com.example.arirangtrail.data.dto.festival;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MyLikedFestivalDTO {

    private String contentid;
    private String title;       // 축제 제목
    private String firstImage;  // 축제 대표 이미지
    private String addr1;       // 축제 주소

    // FestivalEntity를 DTO로 변환하기 위한 생성자
    public MyLikedFestivalDTO(String contentid, String title, String firstImage) {
        this.contentid = contentid;
        this.title = title;
        this.firstImage = firstImage;
    }
}
