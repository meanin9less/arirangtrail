package com.example.arirangtrail.data.repository;

import com.example.arirangtrail.data.entity.ReviewCommentEntity;
import com.example.arirangtrail.data.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewCommentRepository extends JpaRepository<ReviewCommentEntity, Long> {
    List<ReviewCommentEntity> findAllByReviewid(ReviewEntity reviewid);
}
