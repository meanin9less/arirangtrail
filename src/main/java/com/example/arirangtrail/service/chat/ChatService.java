package com.example.arirangtrail.service.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.document.UserChatStatus;
import com.example.arirangtrail.data.dto.chat.ChatMessageDTO;
import com.example.arirangtrail.data.repository.chat.ChatMessageRepository;
import com.example.arirangtrail.data.repository.chat.ChatRoomRepository;
import com.example.arirangtrail.data.repository.chat.UserChatStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query; // ★★★ 1. 올바른 Query 클래스를 import 합니다.
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ★★★ 2. Spring의 Transactional을 사용하는 것이 좋습니다.

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
        ChatRoom chatRoom= chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다. ID: " + roomId));
        return chatRoom;
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

    // userchatsatus의 seq를 변경
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

    // 해당 방의 이전 메세지들을 가져옴
    public List<ChatMessage> getPreviousMessages(Long roomId, Pageable pageable) {
        // Repository를 호출하여 페이징된 결과를 가져옵니다.
        Page<ChatMessage> messagePage = chatMessageRepository.findByRoomIdOrderByMessageSeqDesc(roomId, pageable);

        // 실제 메시지 내용(List<ChatMessage>)만 추출하여 반환합니다.
        // 프론트엔드에서는 순서가 중요하므로, 역순으로 다시 뒤집어서 오름차순(과거->최신)으로 만들어줍니다.
        List<ChatMessage> messages = new ArrayList<>(messagePage.getContent());
        Collections.reverse(messages);

        return messages;
    }

    // 해당 유저 방 참여를 삭제
    @Transactional
    public void leaveRoom(Long roomId, String username) {
        // 1. 해당 유저의 참여 상태 정보를 DB에서 삭제합니다.(userchatsatus에는 해당방 번호와, 참가한 개별 유저별로 저장, lastread같이 저장)
        userChatStatusRepository.deleteByRoomIdAndUsername(roomId, username);

        // 2. (Step 2 연계) 남은 참여자가 있는지 확인합니다.
        long remainingUsers = userChatStatusRepository.countByRoomId(roomId);
        if (remainingUsers == 0) {
            // 남은 사람이 없으면 방과 관련된 모든 데이터를 삭제합니다.
            deleteRoomAndAssociatedData(roomId);
        }
    }

    // (Step 2 & 3 연계) 방과 관련된 모든 데이터를 삭제하는 private 헬퍼 메소드
    private void deleteRoomAndAssociatedData(Long roomId) {
        // 1. 해당 방의 모든 채팅 메시지를 삭제합니다.->chat_messages
        chatMessageRepository.deleteByRoomId(roomId);
        // 2. 해당 방의 모든 참여자 상태 정보를 삭제합니다. (이미 0명이겠지만, 안전을 위해)
        userChatStatusRepository.deleteByRoomId(roomId);
        // 3. 채팅방 자체를 삭제합니다.(chatrooms(방장, 제목)다음 룸 번호는 계속 증가하여 저장시키므로 룸이 겹칠 일은 없음)
        chatRoomRepository.deleteById(roomId);
    }

    @Transactional
    public void deleteRoomByCreator(Long roomId, String username) {
        // 1. 채팅방 정보를 가져옵니다.
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // 2. 요청한 유저가 방장인지 확인합니다. (매우 중요!)
        if (!room.getCreator().equals(username)) {
            throw new SecurityException("방을 삭제할 권한이 없습니다."); // 혹은 다른 권한 예외
        }

        // 3. 방장인 것이 확인되면, 위에서 만든 헬퍼 메소드를 호출하여 모든 데이터를 삭제합니다.
        deleteRoomAndAssociatedData(roomId);
    }

    public List<Long> findMyRoomIdsByUsername(String username) {
        // 1. 특정 유저의 모든 참여 상태를 조회
        List<UserChatStatus> statuses = userChatStatusRepository.findByUsername(username);
        // 2. 참여 상태 목록에서 roomId만 추출하여 리스트로 만듦
        return statuses.stream()
                .map(UserChatStatus::getRoomId)
                .collect(Collectors.toList());
    }
}