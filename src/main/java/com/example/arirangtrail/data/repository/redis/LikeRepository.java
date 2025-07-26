package com.example.arirangtrail.data.repository.redis;

import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.entity.redis.LikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LikeRepository extends JpaRepository<LikeEntity,Long> {

    void deleteByUser_UsernameAndContentid(String username, Long contentid);
}