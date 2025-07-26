package com.example.arirangtrail.service.redis;

import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.entity.redis.FestivalMetaEntity;
import com.example.arirangtrail.data.entity.redis.LikeEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import com.example.arirangtrail.data.repository.redis.FestivalMetaRepository;
import com.example.arirangtrail.data.repository.redis.LikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FestivalService {

    private final RedisTemplate<String, String> redisTemplate;
    private final LikeRepository likeRepository;
    private final FestivalMetaRepository festivalMetaRepository;
    private final UserRepository userRepository;

    // --- 좋아요 관련 로직 ---

    @Transactional
    public boolean toggleLike(String username, Long contentid) {
        String userLikesKey = "user:" + username + ":likes";
        String festivalMetaKey = "festival_meta:" + contentid;
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("해당 사용자를 찾을 수 없습니다: " + username));

        if (Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(userLikesKey, contentid))) {
            // 좋아요 취소
            redisTemplate.opsForSet().remove(userLikesKey, contentid);
            redisTemplate.opsForHash().increment(festivalMetaKey, "like_count", -1);
            likeRepository.deleteByUser_UsernameAndContentid(username, contentid);
            return false; // 좋아요 취소됨
        } else {
            // 좋아요 추가
            redisTemplate.opsForSet().add(userLikesKey, String.valueOf(contentid));
            redisTemplate.opsForHash().increment(festivalMetaKey, "like_count", 1);
            LikeEntity newLike = new LikeEntity();
            newLike.setUser(user);
            newLike.setContentid(contentid);
            likeRepository.save(newLike);
            return true; // 좋아요 추가됨
        }
    }

    public Set<String> getLikedFestivalsByUser(String username) {
        String userLikesKey = "user:" + username + ":likes";
        return redisTemplate.opsForSet().members(userLikesKey);
    }


    // --- 공유 관련 로직 ---
    @Transactional
    public void incrementShareCount(Long contentid) {
        String festivalMetaKey = "festival_meta:" + contentid;

        // 1. Redis 캐시의 공유 횟수 1 증가
        redisTemplate.opsForHash().increment(festivalMetaKey, "share_count", 1);

        // 2. DB에 영구 저장 (존재하지 않으면 새로 생성, 존재하면 카운트 증가)
        FestivalMetaEntity meta = festivalMetaRepository.findById(contentid)
                .orElse(new FestivalMetaEntity(contentid)); // 없으면 새 객체 생성
        meta.setShareCount(meta.getShareCount() + 1);
        festivalMetaRepository.save(meta);
    }

    // --- 정보 조회 관련 로직 ---
    public FestivalMetaEntity getFestivalMeta(Long contentid) {
        String festivalMetaKey = "festival_meta:" + contentid;

        // 1. Redis에서 먼저 조회 시도 (메모리 확인)
        Object likeCountObj = redisTemplate.opsForHash().get(festivalMetaKey, "like_count");
        Object shareCountObj = redisTemplate.opsForHash().get(festivalMetaKey, "share_count");

        // 2. Redis에 캐시가 존재하면, DB까지 안 가고 바로 반환! (Cache Hit)
        if (likeCountObj != null && shareCountObj != null) {
            System.out.println("--- Cache Hit! Redis에서 데이터를 가져옵니다. ---");
            FestivalMetaEntity metaFromCache = new FestivalMetaEntity(contentid);
            metaFromCache.setLikeCount(Long.parseLong(likeCountObj.toString()));
            metaFromCache.setShareCount(Long.parseLong(shareCountObj.toString()));
            return metaFromCache;
        }

        // 3. Redis에 캐시가 없으면, DB에서 조회 (Cache Miss)
        System.out.println("--- Cache Miss! DB에서 데이터를 가져옵니다. ---");
        FestivalMetaEntity metaFromDb = festivalMetaRepository.findById(contentid)
                .orElse(new FestivalMetaEntity(contentid));

        // 4. (중요) DB에서 가져온 데이터를 다음에 또 쓰기 위해 Redis에 저장!
        redisTemplate.opsForHash().put(festivalMetaKey, "like_count", String.valueOf(metaFromDb.getLikeCount()));
        redisTemplate.opsForHash().put(festivalMetaKey, "share_count", String.valueOf(metaFromDb.getShareCount()));

        return metaFromDb;
    }
}
