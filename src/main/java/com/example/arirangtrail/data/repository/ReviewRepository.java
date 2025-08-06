package com.example.arirangtrail.data.repository;

import com.example.arirangtrail.data.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // Optional 임포트 추가

/**
 * ReviewEntity에 대한 데이터베이스 접근을 담당하는 리포지토리 인터페이스입니다.
 * Spring Data JPA를 사용하여 기본적인 CRUD 기능을 제공합니다.
 */
@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    List<ReviewEntity> findByUsernameOrderByCreatedatDesc(String username);

    // Review ID로 리뷰를 찾아올 때 Optional을 반환하도록 (EntityNotFoundException 처리를 위해)
    // JpaRepository에 기본적으로 findById가 있지만, 명시적으로 추가하여 주석으로 설명합니다.
    Optional<ReviewEntity> findById(Long reviewId);

    /**
     * 특정 contentid에 대한 리뷰들의 평균 평점을 조회합니다.
     * @param contentid 평균 평점을 조회할 축제/관광지의 ID
     * @return 해당 contentid의 평균 평점 (리뷰가 없으면 null 반환)
     */
    @Query("SELECT AVG(e.rating) FROM ReviewEntity e WHERE e.contentid = :contentid") // contentid 필드 이름 확인
    Double findAverageRatingByContentid(@Param("contentid") String contentid); // contentid의 타입이 String이므로 변경

    List<ReviewEntity> findByContentid(Long contentid);
}
