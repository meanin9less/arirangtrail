package com.example.arirangtrail.chat;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "chat_messages")// 얘는 엔티티처럼 매핑
public class ChatMessage {
    @Id
    private String id;
    private String roomId;
    private String sender;
    private String message;
    private LocalDateTime timestamp;
}