// src/main/java/com/example/arirangtrail/data/entity/ReviewphotoEntity.java
package com.example.arirangtrail.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 리뷰 사진 정보를 데이터베이스에 매핑하는 엔티티입니다.
 * ReviewEntity와 다대일 관계를 가집니다.
 */
@Getter
@Setter
@Entity
@Table(name = "review_photos") // 실제 데이터베이스 테이블명에 맞춰주세요.
public class ReviewphotoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "photoid", nullable = false)
    private Long id; // 사진 ID

    @ManyToOne(fetch = FetchType.LAZY) // ReviewEntity와의 다대일 관계를 정의합니다.
    @JoinColumn(name = "reviewid", nullable = false) // 외래키 컬럼명을 지정합니다. (ReviewEntity의 reviewid와 연결)
    private ReviewEntity reviewid; // 부모 ReviewEntity

    @Column(name = "imageurl", nullable = false)
    private String imageurl; // 이미지 URL

    @Column(name = "caption")
    private String caption; // 이미지 캡션 (선택 사항)
}
