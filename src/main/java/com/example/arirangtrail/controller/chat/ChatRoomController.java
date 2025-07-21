package com.example.arirangtrail.controller.chat;


import com.example.arirangtrail.chat.ChatRoom;
import com.example.arirangtrail.service.ChatService;
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
    public ResponseEntity<ChatRoom> createRoom(@RequestParam String name) {
        return ResponseEntity.ok(chatService.createRoom(name));
    }

    // 특정 채팅방 조회
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ChatRoom> getRoomById(@PathVariable String roomId) {
        return ResponseEntity.ok(chatService.findRoomById(roomId));
    }
}
