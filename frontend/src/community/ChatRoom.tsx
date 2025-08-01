import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useDispatch, useSelector } from 'react-redux';
import store, { RootState, setTotalUnreadCount } from '../store';
import axios from 'axios';
import apiClient from '../api/axiosInstance';
import { Room } from './CommunityPage';
import {
    IoSend, IoAddCircleOutline, IoCameraOutline, IoArrowBack, IoLogOutOutline,
    IoTrashOutline, IoMegaphoneOutline, IoHandRightOutline, IoHappyOutline,
    IoPeopleOutline, IoCalendarOutline, IoChatbubblesOutline
} from 'react-icons/io5';

// --- 타입 정의 ---
interface ChatMessage {
    type: 'ENTER' | 'TALK' | 'LEAVE' | 'IMAGE' | 'KICK' | 'NOTICE_UPDATE';
    senderNickname?: string;
    roomId: string;
    sender: string;
    message: string;
    messageSeq?: number;
    kickedUsername?: string;
    notice?: string;
}

interface ChatRoomProps {
    roomId: string;
    onLeave: (lastReadSeq: number) => void;
}

interface Participant {
    username: string;
    nickname: string;
}


const ChatRoom = ({ roomId, onLeave }: ChatRoomProps) => {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const userNickname = userProfile?.nickname;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [roomInfo, setRoomInfo] = useState<Room | null>(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedUserToKick, setSelectedUserToKick] = useState<Participant | null>(null);

    const clientRef = useRef<Client | null>(null);
    const lastMessageSeqRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    //공지사항 관련
    const [notice, setNotice] = useState(''); // 공지사항 내용
    const [isNoticeCollapsed, setIsNoticeCollapsed] = useState(true); // 공지 접힘/펼침 상태
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false); // 공지 수정 모달
    const [tempNotice, setTempNotice] = useState(''); // 임시 공지 내용

    const dispatch = useDispatch();
    const API_URL = process.env.REACT_APP_API_URL;

    const updateLastReadSequence = useCallback(async (seqToUpdate: number) => {
        if (!userName || seqToUpdate === 0) return;
        try {
            await apiClient.post(`chat/rooms/update-status`, { roomId, username: userName, lastReadSeq: seqToUpdate });
            console.log(`[읽음 처리/참여 기록] Room: ${roomId}, User: ${userName}, LastReadSeq: ${seqToUpdate}`);
        } catch (error) {
            console.error("읽음 상태 갱신/참여 기록에 실패했습니다.", error);
        }
    }, [roomId, userName]);

    const fetchRoomInfo = useCallback(async () => {
        try {
            const response = await apiClient.get<Room>(`chat/rooms/${roomId}`);
            setRoomInfo(response.data);
            setNotice(response.data.notice || ''); // <<< roomInfo에서 notice 상태 설정
        } catch (error) {
            console.error("채팅방 정보를 가져오는 데 실패했습니다.", error);
        }
    }, [roomId]);

    const fetchPreviousMessages = useCallback(async (): Promise<ChatMessage[]> => {
        try {
            const response = await apiClient.get<ChatMessage[]>(`chat/rooms/${roomId}/messages?size=50`);
            const fetchedMessages = Array.isArray(response.data) ? response.data : [];
            setMessages(fetchedMessages);
            if (fetchedMessages.length > 0) {
                const lastSeq = fetchedMessages[fetchedMessages.length - 1].messageSeq;
                if (lastSeq) {
                    lastMessageSeqRef.current = lastSeq;
                }
            }
            return fetchedMessages;
        } catch (error) {
            console.error("이전 대화 내역을 불러오는 데 실패했습니다.", error);
            setMessages([]);
            return [];
        }
    }, [roomId]);

    const handleUpdateNotice = async () => {
        if (!userName || !roomInfo) return;

        try {
            await apiClient.patch(`/chat/rooms/${roomInfo.id}/notice`, {
                username: userName,
                notice: tempNotice
            });
            // 성공 시 별도 처리 필요 없음. 웹소켓이 처리할 것임.
            setIsNoticeModalOpen(false);
        } catch (error) {
            console.error("공지사항 업데이트 실패:", error);
            alert("공지사항 업데이트에 실패했습니다.");
        }
    };


    const connectWebSocket = useCallback(() => {
        const token = store.getState().token.token;
        if (!userName || !token) return;

        const client = new Client({
            connectHeaders: { Authorization: token },
            webSocketFactory: () => new SockJS(`${API_URL}/ws-stomp`),
            reconnectDelay: 5000,
            debug: (str) => { console.log(new Date(), str); },
            onConnect: () => {
                console.log('STOMP 연결 성공!');
                clientRef.current = client;
                client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body) as ChatMessage;

                    // ===== 공지 업데이트 메시지 처리 시작 =====
                    if (receivedMessage.type === 'NOTICE_UPDATE') {
                        setNotice(receivedMessage.notice ?? '');
                        // 새 공지가 등록/수정되면 펼쳐서 보여주기
                        if(receivedMessage.notice) {
                            setIsNoticeCollapsed(false);
                        }
                        return;
                    }

                    // ✅ [신규] KICK 메시지 처리
                    if (receivedMessage.type === 'KICK') {
                        // 내가 강퇴당했다면
                        if (receivedMessage.kickedUsername === userName) {
                            alert("방장에 의해 채팅방에서 강퇴되었습니다.");
                            // WebSocket 연결을 정상적으로 종료하고 로비로 나감
                            clientRef.current?.deactivate();
                            onLeave(0); // 안 읽은 카운트 갱신 불필요
                        }
                        return; // KICK 메시지는 화면에 표시하지 않음
                    }

                    // 참여자 수 실시간 업데이트 처리
                    if ((receivedMessage as any).type === 'PARTICIPANT_COUNT_UPDATE') {
                        setRoomInfo(prevInfo => prevInfo ? {
                            ...prevInfo,
                            participantCount: (receivedMessage as any).participantCount
                        } : null);
                        return;
                    }

                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    if (receivedMessage.messageSeq) {
                        lastMessageSeqRef.current = receivedMessage.messageSeq;
                    }
                });
                client.publish({
                    destination: '/api/pub/chat/enter',
                    body: JSON.stringify({ roomId, sender: userName, nickname: userNickname, type: 'ENTER' }),
                });
            },
            onStompError: (frame) => { console.error('STOMP Error:', frame); },
        });
        client.activate();
    }, [roomId, userName, API_URL, userNickname]);

    useEffect(() => {
        const token = store.getState().token.token;
        if (!userName || !token) return;

        const initializeAndConnect = async () => {
            if (!userName) return;
            await fetchRoomInfo();
            const previousMessages = await fetchPreviousMessages();
            const lastSeq = previousMessages.length > 0 ? previousMessages[previousMessages.length - 1].messageSeq ?? 0 : 0;
            lastMessageSeqRef.current = lastSeq;
            await updateLastReadSequence(lastMessageSeqRef.current);
            try {
                const response = await apiClient.get(`/chat/users/${userName}/unread-count`);
                dispatch(setTotalUnreadCount(response.data.totalUnreadCount));
            } catch (error) {
                console.error("안 읽은 메시지 개수 업데이트 실패", error);
            }
            connectWebSocket();
        };
        initializeAndConnect();

        return () => {
            const finalReadSeq = lastMessageSeqRef.current;
            console.log(`[나가기 전 읽음 처리] Room: ${roomId}, User: ${userName}, LastReadSeq: ${finalReadSeq}`);
            updateLastReadSequence(finalReadSeq);
            if (clientRef.current?.connected) {
                clientRef.current.publish({
                    destination: '/api/pub/chat/leave',
                    body: JSON.stringify({ roomId, sender: userName, nickname: userNickname, type: 'LEAVE' }),
                });
                clientRef.current.deactivate();
                console.log('STOMP 연결이 비활성화되었습니다.');
            }
        };
    }, [roomId, userName, userNickname, dispatch, fetchRoomInfo, fetchPreviousMessages, updateLastReadSequence, connectWebSocket]);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = () => {
        if (inputMessage.trim() && clientRef.current?.connected && userName) {
            clientRef.current.publish({
                destination: '/api/pub/chat/message',
                body: JSON.stringify({ roomId, sender: userName, nickname: userNickname, message: inputMessage, type: 'TALK' }),
            });
            setInputMessage('');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userName) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post<{ url: string }>(`${API_URL}/api/files/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = response.data.url;
            if (clientRef.current?.connected) {
                clientRef.current.publish({
                    destination: '/api/pub/chat/message',
                    body: JSON.stringify({ roomId, sender: userName, nickname: userNickname, message: imageUrl, type: 'IMAGE' }),
                });
            }
            setIsOptionsOpen(false);
        } catch (error) {
            console.error("이미지 업로드에 실패했습니다.", error);
            alert("이미지 전송에 실패했습니다.");
        }
        if (e.target) e.target.value = '';
    };

    const handleImageIconClick = () => { fileInputRef.current?.click(); setIsOptionsOpen(false); };
    const handleLeaveRoom = async () => {
        if (!userName) return;
        try { await apiClient.post(`chat/rooms/${roomId}/leave`, { username: userName }); alert("채팅방에서 나갔습니다."); onLeave(-1);
        } catch (error) { console.error("채팅방 나가기에 실패했습니다.", error); alert("채팅방을 나가는 중 오류가 발생했습니다."); }
    };
    const handleExitToLobby = () => { onLeave(lastMessageSeqRef.current); };
    const handleDeleteRoom = async () => {
        if (!userName || !window.confirm("정말로 이 방을 삭제하시겠습니까?")) return;
        try { await apiClient.delete(`chat/rooms/${roomId}`, { data: { username: userName } }); alert("채팅방이 삭제되었습니다."); onLeave(0);
        } catch (error) { console.error("방 삭제에 실패했습니다.", error); alert("방을 삭제하는 중 오류가 발생했습니다."); }
    };
    const handleBanUser = async () => {
        if (!userName) return;
        try {
            const response = await apiClient.get<Participant[]>(`/chat/rooms/${roomId}/participants`, {
                params: { username: userName }
            });
            setParticipants(response.data);
            setIsKickModalOpen(true); // 모달 열기
        } catch (error) {
            console.error("참여자 목록을 불러오는데 실패했습니다.", error);
            alert("참여자 목록을 불러오는데 실패했습니다.");
        }
    };
    // [신규] 강퇴 실행 함수
    const handleConfirmKick = async () => {
        if (!selectedUserToKick || !userName) {
            alert("강퇴할 사용자를 선택해주세요.");
            return;
        }

        if (!window.confirm(`정말로 '${selectedUserToKick.nickname}'님을 강퇴하시겠습니까?`)) return;

        try {
            await apiClient.post(`/chat/rooms/${roomId}/kick`, {
                creatorUsername: userName,
                userToKick: selectedUserToKick.username
            });
            alert(`'${selectedUserToKick.nickname}'님이 강퇴되었습니다.`);
            setIsKickModalOpen(false); // 모달 닫기
            setSelectedUserToKick(null); // 선택 초기화
        } catch (error) {
            console.error("사용자 강퇴에 실패했습니다.", error);
            alert("사용자 강퇴 처리 중 오류가 발생했습니다.");
        }
    };

    const handleAnnouncement = () => {
        setTempNotice(notice); // 현재 공지를 임시 상태에 저장
        setIsNoticeModalOpen(true); // 모달 열기
    };

    const handleEmoticonClick = () => { alert("이모티콘 기능은 준비 중입니다."); setIsOptionsOpen(false); };

    const handleOutsideClick = () => { if (isOptionsOpen) setIsOptionsOpen(false); };

    const menuOptions = [
        { icon: <IoHappyOutline size={24} color="#a0a0a0" />, handler: handleEmoticonClick, title: '이모티콘' },
        { icon: <IoCameraOutline size={24} color="#a0a0a0" />, handler: handleImageIconClick, title: '사진 전송' }
    ];

    return (
        <div style={styles.container} onClick={handleOutsideClick}>
            <header style={styles.header}>
                <div style={styles.headerTop}>
                    <div style={styles.headerButtons}>
                        <button onClick={handleExitToLobby} title="로비로 나가기" style={circleButtonStyle}>
                            <IoArrowBack size={20} />
                        </button>
                        <button onClick={handleLeaveRoom} title="방에서 나가기" style={circleButtonStyle}>
                            <IoLogOutOutline size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    </div>
                    {userName === roomInfo?.creator && (
                        <div style={styles.headerButtons}>
                            <button onClick={handleAnnouncement} title="공지사항" style={circleButtonStyle}>
                                <IoMegaphoneOutline size={20} />
                            </button>
                            <button onClick={handleBanUser} title="밴/강퇴" style={circleButtonStyle}>
                                <IoHandRightOutline size={20} />
                            </button>
                            <button onClick={handleDeleteRoom} title="방 삭제하기" style={circleButtonStyle}>
                                <IoTrashOutline size={20} />
                            </button>
                        </div>
                    )}
                </div>
                {roomInfo ? (
                    <div style={styles.roomInfoContainer}>
                        <h2 style={styles.roomTitle}>
                            {roomInfo.title}
                            <span style={styles.subjectPill}>{roomInfo.subject}</span>
                        </h2>
                        <div style={styles.roomMeta}>
                            <div style={styles.metaItem}>
                                <IoPeopleOutline style={styles.metaIcon} />
                                <span>{`${roomInfo.participantCount || 0} / ${roomInfo.maxParticipants || '-'}`}</span>
                            </div>
                            <div style={styles.metaItem}>
                                <IoCalendarOutline style={styles.metaIcon} />
                                <span>{roomInfo.meetingDate ? new Date(roomInfo.meetingDate).toLocaleDateString() : '날짜 미정'}</span>
                            </div>
                            <div style={styles.metaItem}>
                                <IoChatbubblesOutline style={styles.metaIcon} />
                                <span>개설자: <strong>{roomInfo.creatorNickname || roomInfo.creator}</strong></span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <h2 style={{ margin: '0', color: '#6c757d' }}>채팅방 정보 로딩 중...</h2>
                    </div>
                )}
            </header>

            {/* ===== 공지사항 영역 시작 ===== */}
            {notice && ( // notice가 있을 때만 표시
                <div style={noticeStyles.container}>
                    {isNoticeCollapsed ? (
                        <div style={noticeStyles.collapsed} onClick={() => setIsNoticeCollapsed(false)}>
                            <IoChatbubblesOutline size={16} style={{ marginRight: '8px' }} />
                            <span>공지사항이 있습니다.</span>
                        </div>
                    ) : (
                        <div style={noticeStyles.expanded}>
                            <div style={noticeStyles.header}>
                                <strong>📢 공지사항</strong>
                                <button onClick={() => setIsNoticeCollapsed(true)} style={noticeStyles.collapseButton}>접기</button>
                            </div>
                            <p style={noticeStyles.content}>{notice}</p>
                        </div>
                    )}
                </div>
            )}
            {/* ===== 공지사항 영역 끝 ===== */}

            <div ref={messageContainerRef} style={styles.messageList}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.sender === userName ? 'right' : 'left', margin: '15px 0' }}>
                        <div style={{ display: 'flex', flexDirection: msg.sender === userName ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{
                                display: 'inline-block',
                                padding: msg.type === 'IMAGE' ? '0px' : '8px 12px',
                                borderRadius: '18px',
                                maxWidth: '70%',
                                backgroundColor: msg.type === 'IMAGE' ? 'transparent' : (msg.type === 'ENTER' || msg.type === 'LEAVE' ? '#FFFACD' : (msg.sender === userName ? '#DCF8C6' : '#EAEAEA'))
                            }}>
                                {msg.type === 'IMAGE' ? (
                                    <img src={msg.message} alt="채팅 이미지" style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer', display: 'block' }} onClick={() => window.open(msg.message, '_blank')} />
                                ) : (
                                    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{msg.message}</span>
                                )}
                            </div>
                            <small style={{ color: '#6c757d', whiteSpace: 'nowrap' }}>
                                {msg.senderNickname || (msg.sender === userName ? userNickname : msg.sender)}
                            </small>
                        </div>
                    </div>
                ))}
            </div>

            <footer style={styles.footer}>
                <div style={{ position: 'relative' }}>
                    {isOptionsOpen && (
                        <div
                            style={{
                                position: 'absolute', bottom: '60px', left: '1px',
                                display: 'flex', flexDirection: 'column', gap: '8px',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {menuOptions.map((option, index) => (
                                <button
                                    key={option.title} onClick={option.handler} title={option.title}
                                    style={{
                                        ...iconButtonStyle, background: 'white', borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px',
                                        width: '44px', height: '44px',
                                        opacity: isOptionsOpen ? 1 : 0,
                                        transform: isOptionsOpen ? 'translateY(0)' : 'translateY(10px)',
                                        transition: `all 250ms ease-out`,
                                        transitionDelay: `${(menuOptions.length - 1 - index) * 60}ms`
                                    }}
                                >
                                    {option.icon}
                                </button>
                            ))}
                        </div>
                    )}
                    <div style={{
                        display: 'flex', alignItems: 'center', padding: '4px 10px',
                        backgroundColor: '#f0f2f5', borderRadius: '24px', height: '40px'
                    }}>
                        <button onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }} style={iconButtonStyle}>
                            <IoAddCircleOutline size={28} color="#a0a0a0" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                        <input
                            type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="메시지를 입력하세요"
                            style={{
                                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                                fontSize: '16px', marginLeft: '8px', marginRight: '8px'
                            }}
                        />
                        <button onClick={sendMessage} style={iconButtonStyle} disabled={!inputMessage.trim()}>
                            <IoSend size={24} color={inputMessage.trim() ? '#007bff' : '#a0a0a0'} />
                        </button>
                    </div>
                </div>
            </footer>
            {/* ✅ [신규] 강퇴 모달 추가 (React-Modal 같은 라이브러리 사용을 권장) */}
            {isKickModalOpen && (
                <div style={kickModalStyles.overlay}>
                    <div style={kickModalStyles.modal}>
                        <h3>참여자 강퇴시키기</h3>
                        <ul style={kickModalStyles.list}>
                            {participants.length > 0 ? participants.map(p => (
                                <li
                                    key={p.username}
                                    style={{
                                        ...kickModalStyles.listItem,
                                        backgroundColor: selectedUserToKick?.username === p.username ? '#e7f3ff' : 'transparent'
                                    }}
                                    onClick={() => setSelectedUserToKick(p)}
                                >
                                    {p.nickname} ({p.username})
                                </li>
                            )) : <p>강퇴할 다른 참여자가 없습니다.</p>}
                        </ul>
                        <div style={kickModalStyles.buttons}>
                            <button onClick={handleConfirmKick} disabled={!selectedUserToKick} style={{...kickModalStyles.button, ...kickModalStyles.kickButton}}>강퇴하기</button>
                            <button onClick={() => { setIsKickModalOpen(false); setSelectedUserToKick(null); }} style={kickModalStyles.button}>취소</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ===== 공지사항 수정 모달 ===== */}
            {isNoticeModalOpen && (
                <div style={kickModalStyles.overlay}>
                    <div style={kickModalStyles.modal}>
                        <h3>공지사항 수정</h3>
                        <textarea
                            value={tempNotice}
                            onChange={(e) => setTempNotice(e.target.value)}
                            style={noticeStyles.textarea}
                            placeholder="공지 내용을 입력하세요. (비우고 저장 시 삭제)"
                        />
                        <div style={kickModalStyles.buttons}>
                            <button onClick={handleUpdateNotice} style={{...kickModalStyles.button, }}>저장</button> {/*backgroundColor: '#007bff', color: 'white'*/}
                            <button onClick={() => setIsNoticeModalOpen(false)} style={kickModalStyles.button}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const circleButtonStyle: React.CSSProperties = {
    width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white',
    border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: '#495057' // 아이콘 색상을 위해 추가
};

const iconButtonStyle: React.CSSProperties = {
    background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', color: '#6c757d'
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '950px', margin: '20px auto', border: '1px solid #e9ecef', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '90vh', backgroundColor: '#fff' },
    header: { backgroundColor: '#ffffff', padding: '15px 20px', borderBottom: '1px solid #e9ecef', borderRadius: '12px 12px 0 0' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    headerButtons: { display: 'flex', gap: '8px' },
    roomInfoContainer: { textAlign: 'center' },
    roomTitle: { margin: '0 0 8px 0', color: '#343a40', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    subjectPill: { fontSize: '12px', color: '#007bff', backgroundColor: '#e7f3ff', padding: '4px 10px', borderRadius: '12px', fontWeight: '500' },
    roomMeta: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', color: '#495057', marginTop: '10px' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
    metaIcon: { fontSize: '16px', color: '#007bff' },
    messageList: { flexGrow: 1, overflowY: 'auto', padding: '10px 20px' },
    footer: { padding: '10px 20px' },
};

// ✅ [신규] 강퇴 모달 스타일
const kickModalStyles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px' },
    list: { listStyle: 'none', padding: 0, margin: '20px 0', maxHeight: '300px', overflowY: 'auto' },
    listItem: { padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' },
    buttons: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    button: { padding: '8px 16px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' },
    kickButton: { padding: '8px 16px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer', color:"black"}/*{ backgroundColor: '#dc3545', color: 'white', border: 'none' }*/
};

const noticeStyles: { [key: string]: React.CSSProperties } = {
    container: { padding: '0 20px 10px 20px', borderBottom: '1px solid #e9ecef' },
    collapsed: { display: 'flex', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px', cursor: 'pointer' },
    expanded: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    content: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
    collapseButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d' },
    textarea: { width: '100%', minHeight: '100px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical',boxSizing: 'border-box' }
};

export default ChatRoom;