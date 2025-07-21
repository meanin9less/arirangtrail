package com.example.arirangtrail.controller.chat;

import com.example.arirangtrail.data.dto.chat.ChatMessageDTO;
import com.example.arirangtrail.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {

    private final SimpMessagingTemplate template;
    private final ChatService chatService;

    // 경로: /api/pub/chat/enter
    @MessageMapping(value = "/chat/enter")
    public void enterUser(ChatMessageDTO message) {
        message.setMessage(message.getSender() + "님이 채팅방에 참여하였습니다.");
        message.setType(ChatMessageDTO.MessageType.ENTER);
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }

    // 경로: /api/pub/chat/message
    @MessageMapping(value = "/chat/message")
    public void sendMessage(ChatMessageDTO message) {
        message.setType(ChatMessageDTO.MessageType.TALK);
        // 여기서 DB에 메시지 저장 로직을 추가할 수 있습니다.
        chatService.saveMessage(message);
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }
}
