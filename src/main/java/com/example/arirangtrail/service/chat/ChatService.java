package com.example.arirangtrail.service.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.document.UserChatStatus;
import com.example.arirangtrail.data.dto.chat.ChatMessageDTO;
import com.example.arirangtrail.data.repository.chat.ChatMessageRepository;
import com.example.arirangtrail.data.repository.chat.ChatRoomRepository;
import com.example.arirangtrail.data.repository.chat.UserChatStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query; // ★★★ 1. 올바른 Query 클래스를 import 합니다.
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ★★★ 2. Spring의 Transactional을 사용하는 것이 좋습니다.

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SequenceService sequenceService;
    private final UserChatStatusRepository userChatStatusRepository;
    private final MongoTemplate mongoTemplate;

    // 모든 채팅방 찾기
    public List<ChatRoom> findAllRoom() {
        return chatRoomRepository.findAll();
    }

    // 특정 채팅방 찾기 (ID 타입을 Long으로 통일)
    public ChatRoom findRoomById(Long roomId) { // ★★★ 3. 파라미터 타입을 Long으로 변경하여 일관성을 유지합니다.
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다. ID: " + roomId));
    }

    // 채팅방 생성
    @Transactional
    public ChatRoom createRoom(String title, String username) {
        // 1. 새로운 roomId 발급
        long roomId = sequenceService.generateSequence("roomId");

        // 2. ChatRoom 엔티티 생성 및 저장
        ChatRoom newRoom = new ChatRoom();
        newRoom.setId(roomId); // Long 타입 ID 설정
        newRoom.setTitle(title);
        newRoom.setCreator(username);
        newRoom.setLastMessageSeq(0L);
        newRoom.setCreatedAt(LocalDateTime.now());
        newRoom.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(newRoom);

        // 3. 방 생성자의 참여 상태 정보도 함께 저장
        UserChatStatus status = new UserChatStatus();
        status.setUsername(username);
        status.setRoomId(roomId);
        status.setLastReadMessageSeq(0L);
        status.setLastReadAt(LocalDateTime.now());
        userChatStatusRepository.save(status);

        return newRoom;
    }

    // 채팅 메시지 저장
    @Transactional
    public ChatMessage saveMessage(ChatMessageDTO messageDTO) {
        // 1. 해당 채팅방의 lastMessageSeq를 1 증가시키고, 증가된 값을 가져온다.
        long nextSeq = getNextMessageSeqForRoom(messageDTO.getRoomId()); // DTO의 roomId도 Long 타입으로 가정

        // 2. DTO를 실제 DB에 저장될 ChatMessage 엔티티로 변환
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setRoomId(messageDTO.getRoomId());
        chatMessage.setMessageSeq(nextSeq);
        chatMessage.setSender(messageDTO.getSender());
        chatMessage.setMessage(messageDTO.getMessage());
        chatMessage.setMessageType(messageDTO.getType().name());
        chatMessage.setTimestamp(LocalDateTime.now());

        // 3. 변환된 메시지를 DB에 저장
        return chatMessageRepository.save(chatMessage);
    }

    /**
     * 특정 방의 메시지 시퀀스를 안전하게 증가시키고 반환하는 헬퍼 메소드
     */
    private long getNextMessageSeqForRoom(Long roomId) {
        // ChatRoom 엔티티에서 ID 필드 이름이 'id'이므로, 'id'로 조회합니다.
        // MongoDB의 실제 필드명인 '_id'로 조회해도 Spring Data가 알아서 매핑해줍니다.
        Query query = new Query(Criteria.where("id").is(roomId));
        Update update = new Update().inc("lastMessageSeq", 1);
        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true);

        ChatRoom updatedRoom = mongoTemplate.findAndModify(query, update, options, ChatRoom.class);

        if (updatedRoom == null) {
            throw new IllegalArgumentException("시퀀스를 생성할 채팅방을 찾을 수 없습니다. ID: " + roomId);
        }
        return updatedRoom.getLastMessageSeq();
    }

    @Transactional
    public void updateUserChatStatus(Long roomId, String username, long lastReadSeq) {
        // roomId와 username으로 기존 상태를 찾는다.
        UserChatStatus userChatStatus = userChatStatusRepository.findByRoomIdAndUsername(roomId, username)
                .orElse(new UserChatStatus(roomId, username));

        // 받은 seq로 업데이트
        userChatStatus.setLastReadMessageSeq(lastReadSeq);

        // DB에 저장 (기존 문서가 있으면 덮어쓰고, 없으면 새로 삽입됨)
        userChatStatusRepository.save(userChatStatus);
    }
}