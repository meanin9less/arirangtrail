package com.example.arirangtrail.data.dto.chat.chatRoom;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoticeDTO {
    private String notice;
    private String username; // 요청자 확인용
}