package com.example.arirangtrail.data.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReqDTO {
    private Long roomId;
    private String username;
    private long lastReadSeq;
}
