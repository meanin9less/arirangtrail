package com.example.arirangtrail.data.repository.chat;

import com.example.arirangtrail.data.document.UserChatStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserChatStatusRepository extends MongoRepository<UserChatStatus, String> {
    Optional<UserChatStatus> findByRoomIdAndUsername(Long roomId, String username);
}
