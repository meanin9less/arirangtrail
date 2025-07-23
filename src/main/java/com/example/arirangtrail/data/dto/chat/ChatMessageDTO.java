package com.example.arirangtrail.data.dto.chat;

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
}