package com.example.arirangtrail.service.chat;

import com.example.arirangtrail.data.document.ChatMessage;
import com.example.arirangtrail.data.document.ChatRoom;
import com.example.arirangtrail.data.document.UserChatStatus;
import com.example.arirangtrail.data.dto.chat.chatRoom.ChatRoomDetailDTO;
import com.example.arirangtrail.data.dto.chat.chatRoom.ChatRoomListDTO;
import com.example.arirangtrail.data.dto.chat.chatRoom.CreateRoomDTO;
import com.example.arirangtrail.data.dto.chat.chatRoom.ParticipantDTO;
import com.example.arirangtrail.data.dto.chat.message.ChatMessageDTO;
import com.example.arirangtrail.data.dto.chat.message.UnreadUpdateDTO;
import com.example.arirangtrail.data.repository.chat.ChatMessageRepository;
import com.example.arirangtrail.data.repository.chat.ChatRoomRepository;
import com.example.arirangtrail.data.repository.chat.UserChatStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
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
// ✅ 수정: '누가' 요청했는지 알기 위해 username 파라미터를 받도록 변경
    public List<ChatRoomListDTO> findAllRoom(String currentUsername) {
        List<ChatRoom> rooms = chatRoomRepository.findAll();

        return rooms.stream()
                .map(room -> {
                    long participantCount = userChatStatusRepository.countByRoomId(room.getId());

                    // ✅ 수정: 현재 사용자의 이 방에 대한 안 읽은 메시지 개수 계산
                    long unreadCount = userChatStatusRepository.findByRoomIdAndUsername(room.getId(), currentUsername)
                            .map(status -> {
                                long totalMessages = chatMessageRepository.countByRoomId(room.getId());
                                long lastReadSeq = status.getLastReadMessageSeq();
                                return Math.max(0, totalMessages - lastReadSeq);
                            })
                            .orElse(0L); // 참여 기록이 없으면 안 읽은 메시지는 0개

                    return new ChatRoomListDTO(
                            room.getId(),
                            room.getTitle(),
                            room.getSubject(),
                            room.getCreator(),
                            room.getMeetingDate(),
                            participantCount,
                            room.getMaxParticipants(),
                            unreadCount,
                            room.getCreatorNickname()   // 닉네임
                    );
                })
                .collect(Collectors.toList());
    }
    // 특정 채팅방 찾기 (ID 타입을 Long으로 통일)
    public ChatRoomDetailDTO findRoomDetailsById(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("..."));

        Long currentParticipantCount = userChatStatusRepository.countByRoomId(roomId);

        // DTO를 생성해서 반환
        ChatRoomDetailDTO dto = new ChatRoomDetailDTO();
        dto.setId(room.getId());
        dto.setTitle(room.getTitle()); // <-- 이 부분이 제대로 되어 있는지?
        dto.setSubject(room.getSubject()); // <-- 이 부분이 제대로 되어 있는지?
        dto.setCreator(room.getCreator()); // <-- 이 부분이 제대로 되어 있는지?
        dto.setCreatorNickname(room.getCreatorNickname());
        dto.setMeetingDate(room.getMeetingDate()); // <-- 이 부분이 제대로 되어 있는지?
        dto.setMaxParticipants(room.getMaxParticipants()); // <-- 이 부분이 제대로 되어 있는지?
        dto.setNotice(room.getNotice());
        dto.setLastMessageSeq(room.getLastMessageSeq());
        dto.setCreatedAt(room.getCreatedAt());
        dto.setUpdatedAt(room.getUpdatedAt());
        dto.setParticipantCount(currentParticipantCount); // <-- 이 부분은 계산된 값

        return dto; // 이렇게 필드를 하나씩 다 채워줘야 합니다.
    }

    // 채팅방 생성
    @Transactional
    public ChatRoom createRoom(CreateRoomDTO createRoomDTO) {
        // 1. 새로운 roomId 발급
        long roomId = sequenceService.generateSequence("roomId");

        // 2. ChatRoom 엔티티 생성 및 저장
        ChatRoom newRoom = new ChatRoom();
        newRoom.setId(roomId); // Long 타입 ID 설정
        newRoom.setTitle(createRoomDTO.getTitle());
        newRoom.setCreator(createRoomDTO.getUsername());
        newRoom.setCreatorNickname(createRoomDTO.getNickname());
        newRoom.setSubject(createRoomDTO.getSubject());
        newRoom.setMeetingDate(createRoomDTO.getMeetingDate());
        newRoom.setMaxParticipants(createRoomDTO.getMaxParticipants());
        newRoom.setNotice("");
        newRoom.setLastMessageSeq(0L);
        newRoom.setCreatedAt(LocalDateTime.now());
        newRoom.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(newRoom);

        // 3. 방 생성자의 참여 상태 정보도 함께 저장
        UserChatStatus status = new UserChatStatus();
        status.setUsername(createRoomDTO.getUsername());
        status.setNickname(createRoomDTO.getNickname());
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
        long nextSeq = getNextMessageSeqForRoom(messageDTO.getRoomId());

        // 2. DTO를 실제 DB에 저장될 ChatMessage 엔티티로 변환
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setRoomId(messageDTO.getRoomId());
        chatMessage.setMessageSeq(nextSeq);
        chatMessage.setSender(messageDTO.getSender());
        chatMessage.setSenderNickname(messageDTO.getNickname());
        chatMessage.setMessage(messageDTO.getMessage());
        chatMessage.setMessageType(messageDTO.getType().name());
        chatMessage.setTimestamp(LocalDateTime.now());

        // 3. 변환된 메시지를 DB에 저장
        chatMessageRepository.save(chatMessage); // ✅ 여기서 return 하지 않습니다.

        // ✅ 추가: ENTER/LEAVE 메시지일 때 실시간 참여자 수 브로드캐스트
        if ("ENTER".equals(messageDTO.getType().name()) || "LEAVE".equals(messageDTO.getType().name())) {
            // 현재 실제 참여자 수를 다시 계산
            long currentParticipantCount = userChatStatusRepository.countByRoomId(messageDTO.getRoomId());

            // 해당 방의 모든 구독자에게 정확한 참여자 수 전송
            messagingTemplate.convertAndSend(
                    "/sub/chat/room/" + messageDTO.getRoomId(),
                    Map.of(
                            "type", "PARTICIPANT_COUNT_UPDATE",
                            "participantCount", currentParticipantCount
                    )
            );
        }
        // --- 실시간 안 읽음 카운트 업데이트 로직 시작 ---

        // 4. 이 방에 참여하고 있는 모든 유저의 참여 상태를 가져옵니다.
        List<UserChatStatus> participants = userChatStatusRepository.findByRoomId(messageDTO.getRoomId());

        // 5. 메시지를 보낸 사람을 제외한 다른 모든 참여자에게 알림을 보냅니다.
        // 수정: 메세지를 나를 포함한 모든 참여자에게 알림을 보내도록 합니다
        participants.stream()
//                .filter(status -> !status.getUsername().equals(messageDTO.getSender()))
                .forEach(recipientStatus -> {
                    String recipientUsername = recipientStatus.getUsername();

                    // 5-1. 받는 사람의 총 안 읽은 메시지 개수를 다시 계산합니다.
                    long totalUnreadCount = getTotalUnreadCount(recipientUsername);

                    // 5-2. "총 안 읽은 메시지 개수"를 해당 유저의 개인 채널로 보냅니다.
                    messagingTemplate.convertAndSend(
                            "/sub/user/" + recipientUsername,
                            Map.of(
                                    "type", "TOTAL_UNREAD_COUNT_UPDATE",
                                    "totalUnreadCount", totalUnreadCount
                            )
                    );
                });

        // 6. 로비에 있는 모든 사람에게 "어떤 방"에 새 메시지가 왔는지 알려줍니다.
        messagingTemplate.convertAndSend(
                "/sub/chat/lobby",
                Map.of(
                        "type", "LOBBY_ROOM_UPDATE",
                        "roomId", messageDTO.getRoomId()
                )
        );

        // 7. ✅ 모든 작업이 끝난 후, 저장된 메시지 객체를 반환합니다.
        return chatMessage;
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
        // 디버그용 추가 기록
        log.info(">>>>> [읽음 상태 업데이트 요청] Room: {}, User: {}, Seq: {}", roomId, username, lastReadSeq);

        Query query = new Query(Criteria.where("roomId").is(roomId).and("username").is(username));

        // 디버그용 추가 기록2
        UserChatStatus existingStatus = mongoTemplate.findOne(query, UserChatStatus.class);

        if (existingStatus == null) {
            log.warn(">>>>> [업데이트 중단] UserChatStatus가 존재하지 않음 - Room: {}, User: {}", roomId, username);
            return;
        }

        log.info(">>>>> [읽음 상태 업데이트 실행] Room: {}, User: {}, 기존 Seq: {} -> 새 Seq: {}",
                roomId, username, existingStatus.getLastReadMessageSeq(), lastReadSeq);


        Update update = new Update()
                .set("lastReadMessageSeq", lastReadSeq)
                .set("lastReadAt", LocalDateTime.now())
                .setOnInsert("roomId", roomId) // 새로 생성될 때만 적용
                .setOnInsert("username", username); // 새로 생성될 때만 적용

        mongoTemplate.upsert(query, update, UserChatStatus.class);

        // --- ✨ 2. 기존의 안 읽은 메시지 개수 계산 및 전송 로직은 그대로 유지합니다 ---
        long totalMessageCount = chatMessageRepository.countByRoomId(roomId);
        long unreadCount = totalMessageCount - lastReadSeq;
        if (unreadCount < 0) unreadCount = 0;

        UnreadUpdateDTO updateInfo = new UnreadUpdateDTO(roomId, unreadCount);
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

    //방 떠나기
    @Transactional
    public void leaveRoom(Long roomId, String username) {
        // 1. 나가려는 사용자의 참여 정보가 실제로 존재하는지 확인합니다.
        Optional<UserChatStatus> userStatusOpt = userChatStatusRepository.findByRoomIdAndUsername(roomId, username);

        // 2. 만약 참여 정보가 없다면, 아무 작업도 하지 않고 로그만 남기고 종료합니다.
        if (userStatusOpt.isEmpty()) {
            log.warn(">>>>> [채팅방 나가기 실패] User: {}는 Room: {}에 참여하고 있지 않습니다.", username, roomId);
            return;
        }

        // 3. 참여 정보가 존재하면, 현재 방에 몇 명이 있는지 확인합니다.
        long totalUsersInRoom = userChatStatusRepository.countByRoomId(roomId);

        // 4. 그 사람이 유일한 참여자일 경우 (1명일 때)
        if (totalUsersInRoom == 1) {
            log.info(">>>>> [마지막 참여자 퇴장] User: {}가 마지막 참여자이므로 Room: {}와 모든 관련 데이터를 삭제합니다.", username, roomId);
            // 방과 관련된 모든 데이터를 삭제하는 헬퍼 메소드 호출
            deleteRoomAndAssociatedData(roomId);
        }
        // 5. 다른 참여자가 더 있는 경우
        else {
            log.info(">>>>> [일반 참여자 퇴장] User: {}의 참여 정보만 Room: {}에서 삭제합니다.", username, roomId);
            // 해당 사용자의 참여 정보만 삭제합니다.
            userChatStatusRepository.delete(userStatusOpt.get());
        }

        // 6. ✨ 모든 로직이 성공적으로 끝난 후, 로비 구독자들에게 업데이트 신호를 보냅니다.
        log.info(">>>>> [로비 업데이트] Room: {}의 정보 변경 신호를 /sub/chat/lobby로 전송합니다.", roomId);
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

    // 방 지우기
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

    @Transactional
    public void joinRoom(Long roomId, String username, String nickname) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // (밴 목록 확인 로직은 여기에...)
        if (room.getBannedUsernames() != null && room.getBannedUsernames().contains(username)) {
            throw new SecurityException("이 채팅방에 접근할 권한이 없습니다.");
        }

        // ✅ [핵심 추가] 정원 제한 로직
        long currentParticipantCount = userChatStatusRepository.countByRoomId(roomId);
        // 멤버 목록에 이미 포함된 사람이 다시 들어오는 경우는 제외하고 계산해야 합니다.
        boolean isAlreadyMember = userChatStatusRepository.existsByRoomIdAndUsername(roomId, username);

        if (!isAlreadyMember && currentParticipantCount >= room.getMaxParticipants()) {
            throw new IllegalStateException(
                    String.format("채팅방 정원이 초과되었습니다. (현재: %d명, 최대: %d명)",
                            currentParticipantCount, room.getMaxParticipants())
            );
        }
        // 멤버 목록에 없으면 추가
        if (!isAlreadyMember) {
            // UserChatStatus를 먼저 생성/저장
            UserChatStatus status = new UserChatStatus(roomId, username,nickname);
            status.setLastReadMessageSeq(0L); // 처음 들어오므로 0
            userChatStatusRepository.save(status);
        }
    }

    // ✅ [신규] 특정 방의 참여자 목록 조회 서비스
    public List<ParticipantDTO> getParticipants(Long roomId, String requesterUsername) {
        // 방장이 요청한게 맞는지 확인 (선택적이지만, 보안상 좋음)
        chatRoomRepository.findById(roomId)
                .filter(room -> room.getCreator().equals(requesterUsername))
                .orElseThrow(() -> new SecurityException("참여자 목록을 조회할 권한이 없습니다."));

        return userChatStatusRepository.findByRoomId(roomId).stream()
                .filter(status -> !status.getUsername().equals(requesterUsername))
                // ✅ UserChatStatus에서 직접 username과 nickname을 가져와 DTO 생성
                .map(status -> new ParticipantDTO(status.getUsername(), status.getNickname()))
                .collect(Collectors.toList());
    }

    // ✅ [신규] 유저 강퇴 및 밴 처리 서비스
    @Transactional
    public void kickAndBanUser(Long roomId, String creatorUsername, String userToKick) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // 1. 요청자가 방장인지 재확인 (필수)
        if (!room.getCreator().equals(creatorUsername)) {
            throw new SecurityException("사용자를 강퇴할 권한이 없습니다.");
        }

        // 2. 자기 자신은 강퇴할 수 없음
        if (creatorUsername.equals(userToKick)) {
            throw new IllegalArgumentException("자기 자신을 강퇴할 수 없습니다.");
        }

        // 3. 밴 목록에 추가 (중복 방지를 위해 Set 사용 후 List 변환 또는 contains 확인)
        if (!room.getBannedUsernames().contains(userToKick)) {
            room.getBannedUsernames().add(userToKick);
            chatRoomRepository.save(room);
        }

        // 4. UserChatStatus에서 해당 유저 정보 삭제 (채팅방에서 즉시 나가게 됨)
        userChatStatusRepository.deleteByRoomIdAndUsername(roomId, userToKick);

        // 5. WebSocket으로 KICK 이벤트 브로드캐스트
        messagingTemplate.convertAndSend(
                "/sub/chat/room/" + roomId,
                Map.of(
                        "type", "KICK",
                        "roomId", roomId,
                        "kickedUsername", userToKick
                )
        );

        // 6. 참가자 수 변경 이벤트도 함께 보내주면 좋음
        long currentParticipantCount = userChatStatusRepository.countByRoomId(roomId);
        messagingTemplate.convertAndSend(
                "/sub/chat/room/" + roomId,
                Map.of(
                        "type", "PARTICIPANT_COUNT_UPDATE",
                        "participantCount", currentParticipantCount
                )
        );
    }

    @Transactional
    public void updateNotice(Long roomId, String username, String notice) {
        // 1. 채팅방 정보를 가져옵니다.
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다. ID: " + roomId));

        // 2. 요청자가 방장인지 확인합니다.
        if (!room.getCreator().equals(username)) {
            throw new SecurityException("공지사항을 수정할 권한이 없습니다.");
        }

        // 3. 공지사항 내용을 업데이트하고 수정 시간을 기록합니다.
        room.setNotice(notice);
        room.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(room);

        // 4. WebSocket으로 NOTICE_UPDATE 이벤트를 브로드캐스트합니다.
        messagingTemplate.convertAndSend(
                "/sub/chat/room/" + roomId,
                Map.of(
                        "type", "NOTICE_UPDATE",
                        "notice", notice
                )
        );
    }
}