package com.example.arirangtrail.data.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document(collection = "counters")
public class Counter {

    @Id
    private String id; // 예: "roomId", "messageSeq"
    private long seq;
}