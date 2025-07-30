package com.example.arirangtrail.controller.chat;


import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.dto.chat.ChatRoomDetailDTO;
import com.example.arirangtrail.data.dto.chat.ChatRoomListDTO;
import com.example.arirangtrail.data.dto.chat.CreateRoomDTO;
import com.example.arirangtrail.data.dto.chat.UpdateReqDTO;
import com.example.arirangtrail.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

//  공지 수정
//    @PatchMapping("/{roomId}/notice")
//    public ResponseEntity<?> updateNotice(@PathVariable Long roomId, @RequestBody NoticeDTO noticeDTO) {
//        Optional<ChatRoom> roomOpt = chatRoomRepository.findById(roomId);
//        if (roomOpt.isPresent()) {
//            ChatRoom room = roomOpt.get();
//            room.setNotice(noticeDTO.getNotice());
//            room.setUpdatedAt(LocalDateTime.now());
//            chatRoomRepository.save(room);
//            return ResponseEntity.ok("공지사항이 업데이트되었습니다.");
//        } else {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("채팅방이 존재하지 않습니다.");
//        }
//    }

}