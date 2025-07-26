package com.example.arirangtrail.data.entity.redis;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "festivalmeta")
public class FestivalMetaEntity {
    @Id
    @Column(name = "contentid", nullable = false)
    private Long contentid;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "like_count", nullable = false)
    private Long likeCount = 0L;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "share_count", nullable = false)
    private Long shareCount = 0L;

    // orElse를 위한 커스텀 생성자 추가
    public FestivalMetaEntity(Long contentid) {
        this.contentid = contentid;
        this.likeCount = 0L;
        this.shareCount = 0L;
    }
}