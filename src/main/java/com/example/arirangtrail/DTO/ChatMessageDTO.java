package com.example.arirangtrail.DTO;


import lombok.Getter;
import lombok.Setter;

// DTO (Data Transfer Object)
@Getter
@Setter
public class ChatMessageDTO {
    private String roomId;
    private String sender;
    private String message;
}