package com.example.arirangtrail.data.dto.chat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomListDTO {
    private Long id;
    private String title;
    private String creator;
    private long participantCount; // ✨ 참여 인원 수 필드 추가
}