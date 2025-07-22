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

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {
    private final SimpMessagingTemplate template;
    private final ChatService chatService;


    @MessageMapping("/chat/enter") // ★ 목적지를 /chat/enter로 변경
    public void enter(ChatMessageDTO message) {
        message.setMessage(message.getSender() + "님이 입장하셨습니다.");
        // DB 저장 없이, 입장 메시지만 모두에게 방송
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }

    @MessageMapping("/chat/message")
    public void talk(ChatMessageDTO message) {
        // 1. chatService가 seq를 생성해서 반환해준, 완전한 객체를 변수에 담는다.
        ChatMessage savedMessage = chatService.saveMessage(message);

        // 2. seq가 포함된 이 "savedMessage" 객체를 방송한다.
        template.convertAndSend("/sub/chat/room/" + savedMessage.getRoomId(), savedMessage);
    }

//        @GetMapping("/rooms/{roomId}/messages")
//        public ResponseEntity<List<ChatMessage>> getPreviousMessages(
//                @PathVariable Long roomId,
//                @PageableDefault(size = 50, sort = "messageSeq", direction = Sort.Direction.DESC) Pageable pageable) {
//            List<ChatMessage> messages = chatService.getPreviousMessages(roomId, pageable);
//            return ResponseEntity.ok(messages);
//        }

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



}
