package com.example.arirangtrail.controller.redis;

import com.example.arirangtrail.data.dto.festival.FestivalStatusDTO;
import com.example.arirangtrail.data.dto.festival.LikeStatusDTO;
import com.example.arirangtrail.data.dto.festival.LikedUserDTO;
import com.example.arirangtrail.data.entity.redis.FestivalMetaEntity;
import com.example.arirangtrail.service.redis.FestivalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/festivals")
@RequiredArgsConstructor
public class FestivalController {
    private final FestivalService festivalService;

    // 특정축제 좋아요 토글
    @PostMapping("/{contentid}/like")
    public ResponseEntity<LikeStatusDTO> toggleLike(
            @PathVariable Long contentid,
            @RequestParam String username// 어슨 수정할 생각 해놔야 함.
//            @AuthenticationPrincipal String username // security context holder를 통해 현재 토큰의 로그인한 사용자 username 가져오기 자동완성// 근데 경로 닫아놔야 인증함
    ) {
        LikeStatusDTO likestatus = festivalService.toggleLike(username, contentid);
        return ResponseEntity.ok(likestatus); // 현재 좋아요 상태 (true: 좋아요, false: 취소) 반환
    }

    // 특정 축제 공유 1회 증가
    @PostMapping("/{contentid}/share")
    public ResponseEntity<Void> shareFestival(@PathVariable Long contentid) {
        festivalService.incrementShareCount(contentid);
        return ResponseEntity.ok().build(); // 성공했다는 의미로 200 OK만 반환
    }

    // 특정 축제 메타 정보(좋아요/ 공유횟수)를 조회합니다.
    @GetMapping("/{contentid}/meta")
    public ResponseEntity<FestivalMetaEntity> getFestivalMeta(@PathVariable Long contentid) {
        FestivalMetaEntity meta = festivalService.getFestivalMeta(contentid);
        return ResponseEntity.ok(meta);
    }

    // 현재 로그인 한 사용자가 누른 모든 축제 id 목록을 조회합니다.
    @GetMapping("/my-page/likes")
    public ResponseEntity<Set<String>> getMyLikedFestivals(
            @AuthenticationPrincipal String username
    ) {
        Set<String> likedFestivalIds = festivalService.getLikedFestivalsByUser(username);
        return ResponseEntity.ok(likedFestivalIds);
    }

    // 현재 축제의 좋아요 상태와 공유 횟수를 조회후 가져옵니다.(redis->rdbms순)
    @GetMapping("/{contentid}/status")
    public ResponseEntity<FestivalStatusDTO> getFestivalStatus(
            @PathVariable Long contentid,
            // username은 필수값이 아니므로 `required = false`를 추가합니다.
            // 비로그인 사용자는 username 없이 요청을 보내게 됩니다.
            @RequestParam(required = false) String username
    ) {
        FestivalStatusDTO statusDto = festivalService.getFestivalStatus(contentid, username);
        return ResponseEntity.ok(statusDto);
    }

    // 축제에 좋아요 한 사람을 가져옵니다.
    @GetMapping("/{contentid}/liked-users")
    public ResponseEntity<List<LikedUserDTO>> getLikedUsers(@PathVariable Long contentid) {
        List<LikedUserDTO> likedUsers = festivalService.getLikedUsersByFestival(contentid);
        return ResponseEntity.ok(likedUsers);
    }
}
