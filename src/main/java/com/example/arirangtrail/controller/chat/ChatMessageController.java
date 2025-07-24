package com.example.arirangtrail.controller.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import com.example.arirangtrail.data.dto.chat.ChatMessageDTO;
import com.example.arirangtrail.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatMessageController {
    private final SimpMessagingTemplate template;
    private final ChatService chatService;

    @MessageMapping("/chat/enter") // ★ 메세지 매핑은 리퀘스트 매핑에 영향을 받지 않는 웹소켓 전용창구이므로 분리해서 생각!
    public void enter(ChatMessageDTO message) {
        message.setMessage(message.getSender() + "님이 입장하셨습니다.");
        // DB 저장 없이, 입장 메시지만 모두에게 방송
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
        template.convertAndSend("/sub/chat/lobby", "user-entered-or-left");
    }

    @MessageMapping("/chat/message")
    public void talk(ChatMessageDTO message) {
        // 1. chatService가 seq를 생성해서 반환해준, 완전한 객체를 변수에 담는다.
        ChatMessage savedMessage = chatService.saveMessage(message);

        // 2. seq가 포함된 이 "savedMessage" 객체를 방송한다.
        template.convertAndSend("/sub/chat/room/" + savedMessage.getRoomId(), savedMessage);
    }

    // api. 기본적으로 전에 메세지들을 가져온다. 기본설정 가장 최근 메세지 50개
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getPreviousMessages(
            @PathVariable String roomId,
            @PageableDefault(size = 50, sort = "messageSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            // ★ 서비스로 전달하기 전에 Long으로 변환
            Long roomIdLong = Long.parseLong(roomId);
            List<ChatMessage> messages = chatService.getPreviousMessages(roomIdLong, pageable);
            return ResponseEntity.ok(messages);
        } catch (NumberFormatException e) {
            // roomId가 숫자가 아닐 경우의 예외 처리
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/users/{username}/unread-count")
    public ResponseEntity<Map<String, Long>> getTotalUnreadCount(@PathVariable String username) {
        long count = chatService.getTotalUnreadCount(username);
        // 프론트엔드가 사용하기 쉽게 JSON 형태로 반환합니다: { "totalUnreadCount": 5 }
        return ResponseEntity.ok(Map.of("totalUnreadCount", count));
    }

}
