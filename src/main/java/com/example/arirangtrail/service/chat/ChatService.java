package com.example.arirangtrail.service.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.document.UserChatStatus;
import com.example.arirangtrail.data.dto.chat.ChatMessageDTO;
import com.example.arirangtrail.data.dto.chat.ChatRoomListDTO;
import com.example.arirangtrail.data.dto.chat.UnreadUpdateDTO;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ★★★ 2. Spring의 Transactional을 사용하는 것이 좋습니다.

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SequenceService sequenceService;
    private final UserChatStatusRepository userChatStatusRepository;
    private final MongoTemplate mongoTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    // 모든 채팅방 찾기
    public List<ChatRoomListDTO> findAllRoom() {
        List<ChatRoom> rooms = chatRoomRepository.findAll();

        // ✨ stream을 사용하여 각 방의 정보를 DTO로 변환합니다.
        return rooms.stream()
                .map(room -> {
                    // 각 방의 ID로 참여자 수를 센다.
                    long count = userChatStatusRepository.countByRoomId(room.getId());
                    // DTO 객체를 생성하여 반환한다.
                    return new ChatRoomListDTO(room.getId(), room.getTitle(), room.getCreator(), count);
                })
                .collect(Collectors.toList());
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

        // ✨로직이 성공적으로 끝난 후, 로비 구독자들에게 업데이트 신호를 보낸다.
        messagingTemplate.convertAndSend("/sub/chat/lobby", "update");

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

        // --- ✨ 여기가 새로운 실시간 동기화 로직입니다 ---
        // 2. 해당 방의 총 메시지 개수를 가져옵니다.
        long totalMessageCount = chatMessageRepository.countByRoomId(roomId);

        // 3. 안 읽은 메시지 개수를 계산합니다.
        long unreadCount = totalMessageCount - lastReadSeq;
        if (unreadCount < 0) unreadCount = 0;

        // 4. 이 정보를 DTO에 담습니다.
        UnreadUpdateDTO updateInfo = new UnreadUpdateDTO(roomId, unreadCount);

        // 5. '특정 유저'만 구독하는 개인 채널로 업데이트 정보를 보냅니다.
        //    예: /sub/user/aaa  (aaa 유저만 이 메시지를 받습니다)
        messagingTemplate.convertAndSend("/sub/user/" + username, updateInfo);
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
// 1. 먼저 현재 방에 몇 명이 있는지 확인합니다.
        long totalUsersInRoom = userChatStatusRepository.countByRoomId(roomId);

        // 2. 나가려는 사용자의 참여 정보가 실제로 존재하는지 확인합니다.
        Optional<UserChatStatus> userStatusOpt = userChatStatusRepository.findByRoomIdAndUsername(roomId, username);

        // 3. 참여 정보가 존재하고, 그 사람이 유일한 참여자일 경우
        if (userStatusOpt.isPresent() && totalUsersInRoom == 1) {
            // 방과 관련된 모든 데이터를 삭제합니다.
            deleteRoomAndAssociatedData(roomId);
        }
        // 4. 참여 정보는 존재하지만, 다른 참여자가 더 있는 경우
        else if (userStatusOpt.isPresent()) {
            // 해당 사용자의 참여 정보만 삭제합니다.
            userChatStatusRepository.delete(userStatusOpt.get());
        }
        // 5. (예외 처리) 만약 참여 정보가 존재하지 않는다면 아무 작업도 하지 않습니다.
        // 이 부분은 필요에 따라 로그를 남기는 등의 처리를 할 수 있습니다.
        // ✨로직이 성공적으로 끝난 후, 로비 구독자들에게 업데이트 신호를 보낸다.
        messagingTemplate.convertAndSend("/sub/chat/lobby", "update");
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

        // ✨로직이 성공적으로 끝난 후, 로비 구독자들에게 업데이트 신호를 보낸다.
        messagingTemplate.convertAndSend("/sub/chat/lobby", "update");
    }

    public List<Long> findMyRoomIdsByUsername(String username) {
        // 1. 특정 유저의 모든 참여 상태를 조회
        List<UserChatStatus> statuses = userChatStatusRepository.findByUsername(username);
        // 2. 참여 상태 목록에서 roomId만 추출하여 리스트로 만듦
        return statuses.stream()
                .map(UserChatStatus::getRoomId)
                .collect(Collectors.toList());
    }
    //안 읽은 메세지 로직
    public long getTotalUnreadCount(String username) {
        // 1. 해당 유저가 참여한 모든 방의 '참여 기록'을 가져옵니다.
        List<UserChatStatus> statuses = userChatStatusRepository.findByUsername(username);

        // 2. 참여한 방이 없으면, 안 읽은 메시지도 0개입니다.
        if (statuses.isEmpty()) {
            return 0;
        }

        // 3. 각 방의 안 읽은 메시지 수를 계산하여 모두 합산합니다.
        return statuses.stream()
                .mapToLong(status -> {
                    // 4. 해당 방의 전체 메시지 개수를 셉니다.
                    long totalMessages = chatMessageRepository.countByRoomId(status.getRoomId());
                    // 5. (전체 메시지 수) - (내가 마지막으로 읽은 메시지 번호) = 이 방의 안 읽은 개수
                    long unreadCount = totalMessages - status.getLastReadMessageSeq();
                    // 6. 음수가 나오지 않도록 0 미만은 0으로 처리합니다.
                    return Math.max(0, unreadCount);
                })
                .sum(); // 7. 모든 방의 안 읽은 개수를 더하여 최종 결과를 반환합니다.
    }
}