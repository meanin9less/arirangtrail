package com.example.arirangtrail.data.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "reviewphotos")
public class ReviewphotoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "photoid", nullable = false)
    private Long id;

    @NotNull
    // ⭐ 중요: optional=false는 reviewid가 '절대' null이 될 수 없다는 강력한 제약입니다.
    // 객체 생성 시점 등을 고려해 optional = true가 더 유연할 수 있습니다. 여기서는 그대로 둡니다.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // DB 레벨에서의 CASCADE 설정
    @JoinColumn(name = "reviewid", nullable = false)
    private ReviewEntity reviewid; // User가 제공한 필드명 그대로 사용

    @Size(max = 255)
    @NotNull
    @Column(name = "imageurl", nullable = false)
    private String imageurl;

    @Size(max = 255)
    @Column(name = "caption")
    private String caption;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat", nullable = false)
    private Instant createdat;

}