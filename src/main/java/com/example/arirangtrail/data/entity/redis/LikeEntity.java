package com.example.arirangtrail.data.entity.redis;

import com.example.arirangtrail.data.entity.UserEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.CreationTimestamp; // 이 import가 중요

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "likes")
public class LikeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "likesid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "username", nullable = false)
    private UserEntity user;

    // 이 부분을 수정/대체하세요.
    @CreationTimestamp // INSERT 시 자동으로 현재 시간을 입력해줌
    @Column(nullable = false, updatable = false) // null 불가능, 업데이트 불가능
    private LocalDateTime createdat;

    @NotNull
    @Column(name = "contentid", nullable = false)
    private Long contentid;

}