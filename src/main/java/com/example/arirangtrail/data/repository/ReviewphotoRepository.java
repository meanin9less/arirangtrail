package com.example.arirangtrail.data.repository;

import com.example.arirangtrail.data.entity.ReviewphotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewphotoRepository extends JpaRepository<ReviewphotoEntity, Long> {
}
