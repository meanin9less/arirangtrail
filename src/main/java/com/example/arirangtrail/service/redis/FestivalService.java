package com.example.arirangtrail.service.redis;

import com.example.arirangtrail.data.dto.festival.FestivalStatusDTO;
import com.example.arirangtrail.data.dto.festival.LikeStatusDTO;
import com.example.arirangtrail.data.dto.festival.LikedUserDTO;
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

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FestivalService {

    private final RedisTemplate<String, String> redisTemplate;
    private final LikeRepository likeRepository;
    private final FestivalMetaRepository festivalMetaRepository;
    private final UserRepository userRepository;

    // --- 좋아요 관련 로직 ---

    @Transactional
    public LikeStatusDTO toggleLike(String username, Long contentid) {
        String festivalLikesKey = "festival:" + contentid + ":likes";
        String userLikesKey = "user:" + username + ":likes";
        String festivalMetaKey = "festival_meta:" + contentid;
        // Long 타입의 contentid를 String으로 한번만 변환하여 재사용합니다.
        String contentIdStr = String.valueOf(contentid);

        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("해당 사용자를 찾을 수 없습니다: " + username));

        Double score = redisTemplate.opsForZSet().score(festivalLikesKey, username);
        boolean isLiked;

        // isMember 검사 시에도 String 타입을 사용해야 합니다.
        if (score == null) {
            // 좋아요 추가
            redisTemplate.opsForZSet().add(festivalLikesKey, username, System.currentTimeMillis());
            redisTemplate.opsForSet().add(userLikesKey, contentIdStr);
            redisTemplate.opsForHash().increment(festivalMetaKey, "like_count", 1);

            LikeEntity newLike = new LikeEntity();
            newLike.setUser(user);
            newLike.setContentid(contentid);
            likeRepository.save(newLike);
            isLiked = true;
        } else {
            // 좋아요 취소
            redisTemplate.opsForZSet().remove(festivalLikesKey, username);
            redisTemplate.opsForSet().remove(userLikesKey, contentIdStr);
            redisTemplate.opsForHash().increment(festivalMetaKey, "like_count", -1);

            likeRepository.deleteByUser_UsernameAndContentid(username, contentid);
            isLiked = false;
        }
        // (수정) 작업이 끝난 후, Redis에서 최종 likeCount를 다시 조회합니다.
        Object likeCountObj = redisTemplate.opsForHash().get(festivalMetaKey, "like_count");
        long currentLikeCount = (likeCountObj != null) ? Long.parseLong(likeCountObj.toString()) : 0;

        // (수정) 최신 상태를 DTO에 담아 반환합니다.
        return new LikeStatusDTO(isLiked, currentLikeCount);
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

    // 밑의 기존 로직 활용하여 유저 있거나 없거나 축제의 좋아요나 공유 횟수 상태 조회(로그인 안해도 보여줌)
    public FestivalStatusDTO getFestivalStatus(Long contentid, String username) {
        // 1. 기존 메소드를 재활용하여 좋아요/공유 카운트를 가져옵니다.
        FestivalMetaEntity meta = this.getFestivalMeta(contentid);
        long likeCount = meta.getLikeCount();
        long shareCount = meta.getShareCount();
        boolean isLiked = false;

        // 2. 로그인한 사용자(username)가 있는 경우에만 '좋아요' 여부를 확인합니다.
        if (username != null && !username.isEmpty()) {
            String userLikesKey = "user:" + username + ":likes";
            String contentIdStr = String.valueOf(contentid);
            // Redis에서 해당 유저가 이 축제를 '좋아요' 했는지 확인
            isLiked = Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(userLikesKey, contentIdStr));
        }

        // 3. 세 가지 정보를 DTO에 담아 반환합니다.
        return new FestivalStatusDTO(likeCount, shareCount, isLiked);
    }

    // ---기존 정보 조회 관련 로직 ---
    // 축제아이디로 관련 공유 횟수와 좋아요 횟수 카운트
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

    // 축제에 따른 좋아하는 유저
    public List<LikedUserDTO> getLikedUsersByFestival(Long contentid) {
        String festivalLikesKey = "festival:" + contentid + ":likes";

        // 1. Redis Set에서 모든 멤버(username)를 가져옵니다.
        Set<String> usernames = redisTemplate.opsForSet().members(festivalLikesKey);

        if (usernames == null || usernames.isEmpty()) {
            return new ArrayList<>(); // 좋아요 누른 사람이 없으면 빈 리스트 반환
        }

        // 2. 사용자 이름 목록으로 DB에서 실제 사용자 정보(UserEntity)를 한 번에 조회합니다.
        List<UserEntity> users = userRepository.findByUsernameIn(new ArrayList<>(usernames));

        // 3. DB 조회 결과를 최종 DTO 리스트로 변환합니다.
        return users.stream()
                .map(userEntity -> new LikedUserDTO(
                        userEntity.getUsername(),
                        userEntity.getNickname()
                ))
                .collect(Collectors.toList());
    }
}
