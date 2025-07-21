package com.example.arirangtrail.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageDTO {
    public enum MessageType {
        ENTER, TALK, LEAVE
    }
    private MessageType type;
    private String roomId;
    private String sender;
    private String message;
}