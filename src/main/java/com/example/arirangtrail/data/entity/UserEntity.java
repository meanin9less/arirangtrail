package com.example.arirangtrail.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @Size(max = 255)
    @Column(name = "username", nullable = false, length = 20)
    private String username;

    @Size(max = 255)
    @NotNull
    @Column(name = "password", nullable = false)
    private String password;

    @Size(max = 45)
    @NotNull
    @Column(name = "role", nullable = false, length = 45)
    private String role;

    @Size(max = 255)
    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @Size(max = 50)
    @NotNull
    @Column(name = "firstname", nullable = false, length = 50)
    private String firstname;

    @Size(max = 50)
    @NotNull
    @Column(name = "lastname", nullable = false, length = 50)
    private String lastname;

    @Size(max = 50)
    @NotNull
    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    @Size(max = 255)
    @Column(name = "imageurl")
    private String imageurl;

    @CreationTimestamp // INSERT 시 Hibernate가 자동으로 현재 시간을 넣어줌
    @Column(nullable = false, updatable = false)
    private Instant createdat;

    @UpdateTimestamp // UPDATE 시 Hibernate가 자동으로 현재 시간을 넣어줌
    @Column(nullable = false)
    private Instant updatedat;

    @Column(name = "birthdate")
    private LocalDate birthdate;

}