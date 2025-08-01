package com.example.arirangtrail.data.dto.chat.message;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageDTO {
    public enum MessageType {
        ENTER, TALK, LEAVE, IMAGE
    }
    private MessageType type;
    private Long roomId;
    private String sender;
    private String message;
    // 닉네임 추가
    private String nickname;
}