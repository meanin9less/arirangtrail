package com.example.arirangtrail.data.dto.chat.chatRoom;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateRoomDTO {
    private String title;
    private String subject;
    private LocalDateTime meetingDate;
    private Integer maxParticipants;
    private String username;
    private String nickname; // ✅ 추가: 방 생성자 닉네임
}
