package com.example.arirangtrail.data.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "chat_messages")// 얘는 엔티티처럼 매핑
public class ChatMessage {
    @Id
    private String id;

    private Long roomId;
    private Long messageSeq;
    private String sender;
    private String message;
    private String messageType;

    private LocalDateTime timestamp;
}