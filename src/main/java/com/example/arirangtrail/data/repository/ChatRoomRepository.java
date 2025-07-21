package com.example.arirangtrail.data.repository;

import com.example.arirangtrail.chat.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {
}