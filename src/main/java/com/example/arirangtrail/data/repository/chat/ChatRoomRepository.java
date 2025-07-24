package com.example.arirangtrail.data.repository.chat;

import com.example.arirangtrail.data.document.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChatRoomRepository extends MongoRepository<ChatRoom, Long> {
}