package com.example.arirangtrail.data.repository.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByRoomId(String roomId);
}