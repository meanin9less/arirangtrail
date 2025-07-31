package com.example.arirangtrail.data.dto.chat;

import com.example.arirangtrail.data.document.ChatRoom;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDetailDTO {
    private Long id; // 숫자 타입의 roomId
    private String title; // 채팅방 제목
    private String subject; // 축제 이름 (이미 존재)
    private String creator; // 방 생성자 (username)
    private LocalDateTime meetingDate; // 모임 날짜
    private Integer maxParticipants; // 방 총 제한 인원수
    private Long participantCount; // 현재 참여자 수
    private String notice; // 공지사항
    private long lastMessageSeq; // 마지막 메시지 순번
    private LocalDateTime createdAt; // 방 생성일 (이미 존재)
    private LocalDateTime updatedAt; // 방 수정일
    private String creatorNickname;
}
