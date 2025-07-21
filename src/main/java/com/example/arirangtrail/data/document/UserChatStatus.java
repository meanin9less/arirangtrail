package com.example.arirangtrail.data.document;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "userChatStatus")
public class UserChatStatus {

    @Id
    private String id;

    private String username;
    private Long roomId;

    private long lastReadMessageSeq;
    private LocalDateTime lastReadAt; // 마지막으로 읽은 시간 (부가 정보)
}