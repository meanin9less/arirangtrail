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
    private Long id; // 숫자 타입의 roomId

    private String title; // 채팅방 제목
    private String subject; // 축제 이름 (이미 존재)
    private String creator; // 방 생성자 (username)
    private String creatorNickname; // ✅ 추가: 생성자 닉네임
    private LocalDateTime meetingDate; // 모임 날짜
    private Integer maxParticipants; // 방 총 제한 인원수
    private String notice; // 공지사항

    private long lastMessageSeq; // 마지막 메시지 순번
    private LocalDateTime createdAt; // 방 생성일 (이미 존재)
    private LocalDateTime updatedAt; // 방 수정일
}
