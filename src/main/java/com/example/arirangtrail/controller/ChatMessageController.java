package com.example.arirangtrail.controller;

import com.example.arirangtrail.DTO.ChatMessageDTO;
import lombok.Getter;
import lombok.Setter;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {

    private final SimpMessagingTemplate template; // 특정 Broker로 메세지를 전달

    // 클라이언트가 /pub/chat/enter 로 메시지를 발행하면 이 메서드가 처리합니다.
    @MessageMapping(value = "/chat/enter")
    public void enterUser(ChatMessageDTO message) {
        message.setMessage(message.getSender() + "님이 채팅방에 참여하였습니다.");
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }

    // 클라이언트가 /pub/chat/message 로 메시지를 발행하면 이 메서드가 처리합니다.
    @MessageMapping(value = "/chat/message")
    public void sendMessage(ChatMessageDTO message) {
        template.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }
}
