package com.example.arirangtrail.data.document;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "userChatStatus")
@CompoundIndex(name = "room_user_unique_idx", def = "{'roomId' : 1, 'username' : 1}", unique = true)
public class UserChatStatus {

    @Id
    private String id;

    private String username;
    private Long roomId;

    private long lastReadMessageSeq;
    private LocalDateTime lastReadAt; // 마지막으로 읽은 시간 (부가 정보)

    //새로운 채팅 참여 상태를 생성하기 위한 생성자입니다
    public UserChatStatus(Long roomId, String username) {
        this.roomId = roomId;
        this.username = username;
        this.lastReadMessageSeq = 0L; // 처음에는 0으로 시작
        this.lastReadAt = LocalDateTime.now();
    }
}