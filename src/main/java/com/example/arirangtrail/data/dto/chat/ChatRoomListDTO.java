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
    private String subject; // ✨ 주제 필드 추가
    private String creator;
    private long participantCount;
}