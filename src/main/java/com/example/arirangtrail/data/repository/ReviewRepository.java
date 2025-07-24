// src/main/java/com/example/arirangtrail/data/repository/ReviewRepository.java
package com.example.arirangtrail.data.repository;

import com.example.arirangtrail.data.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ReviewEntity에 대한 데이터베이스 접근을 담당하는 리포지토리 인터페이스입니다.
 * Spring Data JPA를 사용하여 기본적인 CRUD 기능을 제공합니다.
 */
@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> { // ✨ ReviewEntity의 ID 타입에 맞춰 Long으로 변경
    /**
     * 특정 사용자가 작성한 리뷰 목록을 조회합니다.
     * @param username 조회할 사용자의 ID
     * @return 해당 사용자가 작성한 ReviewEntity 목록
     */
    List<ReviewEntity> findByUsername(String username);
}
