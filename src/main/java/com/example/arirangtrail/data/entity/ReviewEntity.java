// src/main/java/com/example/arirangtrail/data/entity/ReviewEntity.java
package com.example.arirangtrail.data.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 리뷰 정보를 데이터베이스의 'reviews' 테이블에 매핑하는 엔티티입니다.
 * 필드 타입과 제약 조건은 데이터베이스 스키마와 일치해야 합니다.
 */
@Getter
@Setter
@Entity
@Table(name = "reviews")
public class ReviewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID 자동 생성 전략 (IDENTITY는 DB에 위임)
    @Column(name = "reviewid", nullable = false)
    private Long id; // 리뷰 ID (Long 타입)

    @Size(max = 255)
    @NotNull
    @Column(name = "username", nullable = false, length = 20)
    private String username; // 작성자 ID

    @NotNull
    @Column(name = "contentid", nullable = false)
    private Long contentid; // 축제/관광지 ID (Long 타입)

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title; // 리뷰 제목

    @NotNull
    @Lob // Large Object, 긴 문자열을 저장할 때 사용
    @Column(name = "content", nullable = false)
    private String content; // 리뷰 내용

    @NotNull
    @Column(name = "rating", nullable = false, precision = 2, scale = 1)
    private BigDecimal rating; // 별점 (BigDecimal 타입, 정수부 2자리, 소수부 1자리)

    @Column(name = "visitdate")
    private LocalDate visitdate; // 방문일 (LocalDate 타입)

    @CreationTimestamp // INSERT 시 Hibernate가 자동으로 현재 시간을 넣어줌
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdat;// 생성일 (Instant 타입)

    @UpdateTimestamp // UPDATE 시 Hibernate가 자동으로 현재 시간을 넣어줌
    @Column(nullable = false)
    private LocalDateTime updatedat;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    // review 필드에 의해 매핑되며, ReviewEntity가 삭제되면 연관된 ReviewphotoEntity도 삭제됩니다.
    private List<ReviewphotoEntity> reviewphotos = new ArrayList<>(); // 리뷰에 첨부된 사진 목록

    @Size(max = 255)
    @NotNull
    @Column(name = "contenttitle", nullable = false)
    private String contenttitle; // 축제/관광지 제목

    /**
     * 연관관계 편의 메소드: 리뷰에 연결된 사진 목록을 변경합니다.
     * 이 메소드를 사용하여 사진을 추가하거나 제거하면, JPA가 자동으로 데이터베이스에 반영합니다.
     * @param newPhotos 새로 연결할 ReviewphotoEntity 목록
     */
    public void changePhotos(List<ReviewphotoEntity> newPhotos) {
        // 기존 사진 모두 제거 (orphanRemoval=true에 의해 DB에서도 삭제됨)
        if (this.reviewphotos != null) {
            this.reviewphotos.clear();
        } else {
            this.reviewphotos = new ArrayList<>();
        }

        // 새로운 사진 추가 및 연관관계 설정
        if (newPhotos != null && !newPhotos.isEmpty()) {
            for (ReviewphotoEntity newPhoto : newPhotos) {
                newPhoto.setReview(this); // 핵심: 자식 엔티티에 부모(자기 자신)를 설정
                this.reviewphotos.add(newPhoto);
            }
        }
    }
}
