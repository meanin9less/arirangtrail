package com.example.arirangtrail.data.dto.chat;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateRoomDTO {
    private String title;
    private String username;
    private String subject;
    private LocalDateTime meetingDate;
    private Integer maxParticipants;
}
