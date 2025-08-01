package com.example.arirangtrail.controller.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import com.example.arirangtrail.data.dto.chat.message.ChatMessageDTO;
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

    @MessageMapping("/chat/enter")
    public void enter(ChatMessageDTO message) {
        // 프론트에서 보낸 nickname을 그대로 사용합니다. (이제 프론트와 필드명이 동일합니다)
        String entranceNickname = message.getNickname() != null ? message.getNickname() : message.getSender();

        // 메시지 내용을 설정합니다.
        message.setMessage(entranceNickname + "님이 입장하셨습니다.");

        // ★★★ 이제 DTO의 'nickname' 필드는 이미 프론트에서 보내준 값으로 채워져 있으므로,
        // 별도로 set 할 필요 없이 그대로 방송하면 됩니다.
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
        template.convertAndSend("/sub/chat/lobby", "user-entered-or-left");
    }

    @MessageMapping("/chat/message")
    public void talk(ChatMessageDTO message) {
        // ChatService는 프론트에서 받은 DTO의 nickname을
        // ChatMessage Document의 senderNickname 필드에 저장하도록 수정해야 합니다.
        ChatMessage savedMessage = chatService.saveMessage(message);

        // 서비스에서 반환된 객체는 모든 정보가 담겨있으므로 그대로 방송합니다.
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
