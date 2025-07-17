package com.example.arirangtrail.data.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "reviews")
public class ReviewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reviewid", nullable = false)
    private Long id;

    @Size(max = 20)
    @NotNull
    @Column(name = "username", nullable = false, length = 20)
    private String username;

    @NotNull
    @Column(name = "contentid", nullable = false)
    private Long contentid;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @NotNull
    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @NotNull
    @Column(name = "rating", nullable = false, precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "visitdate")
    private LocalDate visitdate;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat", nullable = false)
    private Instant createdat;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updatedat", nullable = false)
    private Instant updatedat;

    @OneToMany(mappedBy = "reviewid")
    private Set<ReviewphotoEntity> reviewphotos = new LinkedHashSet<>();

    @Size(max = 255)
    @NotNull
    @Column(name = "contenttitle", nullable = false)
    private String contenttitle;

}