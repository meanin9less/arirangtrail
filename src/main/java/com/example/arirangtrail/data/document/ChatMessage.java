package com.example.arirangtrail.data.document;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String sender; // username
    private String nickname; // ✅ 추가: 보낸 사람 닉네임
    private String message;
    @JsonProperty("type")
    private String messageType;

    private LocalDateTime timestamp;
}