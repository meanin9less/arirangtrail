package com.example.arirangtrail.chat;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document(collection = "chat_rooms")// 몽고 db 콜렉션과 연관성 지니게 됨.
public class ChatRoom {
    @Id
    private String id; // MongoDB의 ObjectId가 자동으로 할당됩니다. 이것이 roomId가 됩니다.
    private String name;

    public static ChatRoom create(String name) {
        ChatRoom chatRoom = new ChatRoom();
        chatRoom.name = name;
        return chatRoom;
    }
}
