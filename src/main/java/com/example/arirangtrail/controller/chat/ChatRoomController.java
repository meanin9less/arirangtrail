package com.example.arirangtrail.controller.chat;


import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.dto.chat.CreateRoomDTO;
import com.example.arirangtrail.data.dto.chat.UpdateReqDTO;
import com.example.arirangtrail.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatRoomController {

    private final ChatService chatService;

    // 모든 채팅방 목록 반환
    @GetMapping// 루트 생략하면 레스트매핑 그대로 "/api/chat/rooms"
    public ResponseEntity<List<ChatRoom>> getAllRooms() {
        return ResponseEntity.ok(chatService.findAllRoom());
    }

    // 채팅방 생성
    @PostMapping// 루트 생략하면 레스트매핑 그대로 "/api/chat/rooms"
    public ResponseEntity<ChatRoom> createRoom(@RequestBody CreateRoomDTO createRoomDTO) {

        return ResponseEntity.ok(chatService.createRoom(createRoomDTO.getTitle(),createRoomDTO.getUsername()));
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
    public ResponseEntity<ChatRoom> getRoomInfo(@PathVariable String roomId) { // ★ 여기도 String으로 변경
        try {
            Long roomIdLong = Long.parseLong(roomId);
            ChatRoom roomInfo = chatService.findRoomById(roomIdLong);
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

}