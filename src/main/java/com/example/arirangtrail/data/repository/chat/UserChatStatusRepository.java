package com.example.arirangtrail.data.repository.chat;

import com.example.arirangtrail.data.document.UserChatStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;

import java.util.List;
import java.util.Optional;

public interface UserChatStatusRepository extends MongoRepository<UserChatStatus, String> {
    Optional<UserChatStatus> findByRoomIdAndUsername(Long roomId, String username);

    void deleteByRoomIdAndUsername(Long roomId, String username);

    long countByRoomId(Long roomId);

    void deleteByRoomId(Long roomId);

    List<UserChatStatus> findByUsername(String username);

    @Query("{ 'roomId': ?0, 'username': ?1 }")
    @Update("{ '$set': { 'lastReadMessageSeq': ?2, 'lastReadAt': new Date() }, '$setOnInsert': { 'roomId': ?0, 'username': ?1 } }")
    void upsertLastReadSeq(Long roomId, String username, long lastReadSeq);

    List<UserChatStatus> findByRoomId(Long roomId);

    boolean existsByRoomIdAndUsername(Long roomId, String username);
}
