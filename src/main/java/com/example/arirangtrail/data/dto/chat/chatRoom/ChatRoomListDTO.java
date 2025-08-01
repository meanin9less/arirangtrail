package com.example.arirangtrail.data.dto.chat.chatRoom;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ChatRoomListDTO {
    private Long id;
    private String title;
    private String subject;
    private String creator;
    private LocalDateTime meetingDate;
    private long participantCount;
    private Integer maxParticipants;
    private long unreadCount;
    private String creatorNickname;
}