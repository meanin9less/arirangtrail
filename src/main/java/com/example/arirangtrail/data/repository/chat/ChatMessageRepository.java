package com.example.arirangtrail.data.repository.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;

import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByRoomId(String roomId);
    Page<ChatMessage> findByRoomIdOrderByMessageSeqDesc(Long roomId, Pageable pageable);
}