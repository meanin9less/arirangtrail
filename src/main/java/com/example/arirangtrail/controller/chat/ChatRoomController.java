package com.example.arirangtrail.controller.chat;


import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.dto.chat.CreateRoomDTO;
import com.example.arirangtrail.data.dto.chat.UpdateReqDTO;
import com.example.arirangtrail.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatRoomController {

    private final ChatService chatService;

    // 모든 채팅방 목록 반환
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoom>> getAllRooms() {
        return ResponseEntity.ok(chatService.findAllRoom());
    }

    // 채팅방 생성
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoom> createRoom(@RequestBody CreateRoomDTO createRoomDTO) {

        return ResponseEntity.ok(chatService.createRoom(createRoomDTO.getTitle(),createRoomDTO.getUsername()));
    }

    // 특정 채팅방 조회
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ChatRoom> getRoomById(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.findRoomById(roomId));
    }

    // 사용자가 마지막으로 읽은 메세지에 대하여 userchatstatus의 seq를 업데이트함
    @PostMapping("/rooms/update-status")
    public ResponseEntity<Void> updateUserChatStatus(@RequestBody UpdateReqDTO requestDto) {
        chatService.updateUserChatStatus(
                requestDto.getRoomId(),
                requestDto.getUsername(),
                requestDto.getLastReadSeq()
        );
        return ResponseEntity.ok().build();
    }
}