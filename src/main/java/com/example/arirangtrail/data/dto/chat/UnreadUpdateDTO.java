package com.example.arirangtrail.data.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UnreadUpdateDTO {
    private Long roomId;
    private long unreadCount;
}