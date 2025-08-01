package com.example.arirangtrail.controller.chat;


import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.dto.chat.chatRoom.*;
import com.example.arirangtrail.data.dto.chat.message.UpdateReqDTO;
import com.example.arirangtrail.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatRoomController {
    private final ChatService chatService;

    // 모든 채팅방 목록 반환
    @GetMapping
    public ResponseEntity<List<ChatRoomListDTO>> getAllRooms(@RequestParam String username) {
        return ResponseEntity.ok(chatService.findAllRoom(username));
    }

    // 채팅방 생성
    @PostMapping// 루트 생략하면 레스트매핑 그대로 "/api/chat/rooms"
    public ResponseEntity<ChatRoom> createRoom(@RequestBody CreateRoomDTO createRoomDTO) {
        System.out.println("방 생성 요청 도착: " + createRoomDTO);
        return ResponseEntity.ok(chatService.createRoom(createRoomDTO));
    }

    // 사용자가 마지막으로 읽은 메세지에 대하여 userchatstatus의 seq를 업데이트함
    @PostMapping("/update-status")
    public ResponseEntity<Void> updateUserChatStatus(@RequestBody UpdateReqDTO requestDto) {
        chatService.updateUserChatStatus(
                requestDto.getRoomId(),
                requestDto.getUsername(),
                requestDto.getLastReadSeq()
        );
        return ResponseEntity.ok().build();
    }

    //해당 방 정보 읽어옴(방 컬렉션 내용)
    @GetMapping("/{roomId}")
    public ResponseEntity<ChatRoomDetailDTO> getRoomInfo(@PathVariable String roomId) {
        try {
            Long roomIdLong = Long.parseLong(roomId);
            ChatRoomDetailDTO roomInfo = chatService.findRoomDetailsById(roomIdLong);
            return ResponseEntity.ok(roomInfo);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 채팅방 나가는 api
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable Long roomId,
            @RequestBody Map<String, String> payload) { // 프론트에서 { "username": "..." } 형태로 보낼 것을 가정

        String username = payload.get("username");

        // ✨ --- 디버깅을 위한 로그 추가 --- ✨
        log.info(">>>>> [채팅방 나가기 요청 수신] Room ID: {}, Username: {}", roomId, username);
        if (username == null) {
            log.error(">>>>> [오류] 페이로드에서 username을 찾을 수 없습니다! payload: {}", payload);
            return ResponseEntity.badRequest().build(); // 잘못된 요청이므로 400 에러 반환
        }

        chatService.leaveRoom(roomId, username);
        return ResponseEntity.ok().build();
    }

    // ★★★ 방장이 채팅방을 삭제하는 API ★★★
    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable Long roomId,
            @RequestBody Map<String, String> payload) { // 실제로는 JWT에서 유저 정보를 가져와야 안전합니다.

        String username = payload.get("username");
        chatService.deleteRoomByCreator(roomId, username);
        return ResponseEntity.ok().build();
    }


    // ★★★ 내 참여방 ID 목록을 반환하는 API ★★★추후
    @GetMapping("/my-rooms")
    // 실제로는 @AuthenticationPrincipal을 통해 로그인된 유저 정보를 가져옵니다.
    public ResponseEntity<List<Long>> getMyRoomIds(@RequestParam String username) {
        List<Long> myRoomIds = chatService.findMyRoomIdsByUsername(username);
        return ResponseEntity.ok(myRoomIds);
    }

    //조인 룸 컨트롤러
    @PostMapping("/{roomId}/join")
    public ResponseEntity<?> joinRoom(
            @PathVariable Long roomId,
            @RequestBody JoinRoomRequestDTO request) {

        String username = request.getUsername();
        String nickname = request.getNickname();

        if (username == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "사용자 정보가 없습니다."));
        }

        try {
            // ✅ 입장 시도 (정원 체크, 밴 체크 등 포함)
            chatService.joinRoom(roomId, username,nickname);

            // ✅ 성공 시 방 정보도 함께 반환
            ChatRoomDetailDTO roomInfo = chatService.findRoomDetailsById(roomId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "입장 성공",
                    "roomInfo", roomInfo
            ));

        } catch (IllegalStateException e) {
            // 정원 초과 등의 상태 오류
            log.warn(">>>>> [입장 실패] Room: {}, User: {}, Reason: {}", roomId, username, e.getMessage());
            return ResponseEntity.status(409) // Conflict
                    .body(Map.of("success", false, "message", e.getMessage()));

        } catch (SecurityException e) {
            // 밴당한 사용자 등의 보안 오류
            log.warn(">>>>> [입장 거부] Room: {}, User: {}, Reason: {}", roomId, username, e.getMessage());
            return ResponseEntity.status(403) // Forbidden
                    .body(Map.of("success", false, "message", e.getMessage()));

        } catch (IllegalArgumentException e) {
            // 존재하지 않는 방 등
            log.error(">>>>> [입장 오류] Room: {}, User: {}, Reason: {}", roomId, username, e.getMessage());
            return ResponseEntity.status(404) // Not Found
                    .body(Map.of("success", false, "message", "존재하지 않는 채팅방입니다."));

        } catch (Exception e) {
            // 기타 예상치 못한 오류
            log.error(">>>>> [입장 실패] Room: {}, User: {}, Unexpected error: ", roomId, username, e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "message", "서버 오류가 발생했습니다."));
        }
    }

    // ✅ [신규] 참여자 목록 조회 API
    @GetMapping("/{roomId}/participants")
    public ResponseEntity<List<ParticipantDTO>> getParticipants(
            @PathVariable Long roomId,
            @RequestParam String username) { // 실제로는 @AuthenticationPrincipal 로 가져와야 안전
        List<ParticipantDTO> participants = chatService.getParticipants(roomId, username);
        return ResponseEntity.ok(participants);
    }

    // ✅ [신규] 강퇴/밴 처리 API
    @PostMapping("/{roomId}/kick")
    public ResponseEntity<Void> kickUser(
            @PathVariable Long roomId,
            @RequestBody Map<String, String> payload) { // { "creatorUsername": "...", "userToKick": "..." }

        String creatorUsername = payload.get("creatorUsername"); // 방장
        String userToKick = payload.get("userToKick"); // 강퇴할 유저

        chatService.kickAndBanUser(roomId, creatorUsername, userToKick);
        return ResponseEntity.ok().build();
    }


    // ✅ [신규] 공지사항 업데이트(수정/삭제) API
    @PatchMapping("/{roomId}/notice")
    public ResponseEntity<Void> updateNotice(
            @PathVariable Long roomId,
            @RequestBody NoticeDTO noticeDTO) {
        chatService.updateNotice(roomId, noticeDTO.getUsername(), noticeDTO.getNotice());
        return ResponseEntity.ok().build();
    }

}