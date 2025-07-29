package com.example.arirangtrail.data.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "chatRooms")
public class ChatRoom {

    @Id
    private Long id; // 이제 ObjectId가 아닌 숫자 타입의 roomId를 사용

    private String title;
    private String subject; // ✨ 주제 필드 추가
    private String creator; // 우선 사용자 이름(username)만 저장

    private long lastMessageSeq; // 이 방의 마지막 메시지 순번

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
