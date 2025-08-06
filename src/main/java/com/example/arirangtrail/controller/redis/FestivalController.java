package com.example.arirangtrail.controller.redis; // 패키지명 확인

import com.example.arirangtrail.data.dto.festival.FestivalStatusDTO;
import com.example.arirangtrail.data.dto.festival.LikeStatusDTO;
import com.example.arirangtrail.data.dto.festival.LikedUserDTO;
import com.example.arirangtrail.data.dto.festival.MyLikedFestivalDTO;
import com.example.arirangtrail.data.entity.redis.FestivalMetaEntity;
import com.example.arirangtrail.service.redis.FestivalService; // FestivalService 임포트 확인
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus; // HttpStatus 임포트 추가
import java.security.Principal; // Principal 임포트 추가

import java.util.Collections;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/festivals") // 기본 경로 /api/festivals
@RequiredArgsConstructor
public class FestivalController { // 이름이 FestivalController로 되어있습니다.
    private final FestivalService festivalService;

    // 특정축제 좋아요 토글
    @PostMapping("/{contentid}/like")
    public ResponseEntity<LikeStatusDTO> toggleLike(
            @PathVariable Long contentid,
            Principal principal
    ) {
        // 인증되지 않은 사용자의 경우 401 반환
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = principal.getName();
        LikeStatusDTO likestatus = festivalService.toggleLike(username, contentid);
        return ResponseEntity.ok(likestatus);
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

    // 내가 좋아요 한 리스트를 가져옵니다.
    @GetMapping("/likes/my-list")
    public ResponseEntity<List<MyLikedFestivalDTO>> getMyLikedFestivalsDetails(
            Principal principal
    ) {
        // 인증되지 않은 사용자의 경우 401 반환
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = principal.getName();
        List<MyLikedFestivalDTO> likedFestivals = festivalService.getMyLikedFestivalsDetails(username);
        return ResponseEntity.ok(likedFestivals);
    }


    // 현재 축제의 좋아요 상태와 공유 횟수를 조회후 가져옵니다.(redis->rdbms순)
    @GetMapping("/{contentid}/status")
    public ResponseEntity<FestivalStatusDTO> getFestivalStatus(
            @PathVariable Long contentid,
            Principal principal // Principal로 변경, required = false 제거
    ) {
        // Principal이 null이면 비로그인 상태로 처리
        String username = (principal != null) ? principal.getName() : null;

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
