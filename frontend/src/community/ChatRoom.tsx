import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useDispatch, useSelector } from 'react-redux';
import store, { RootState, setTotalUnreadCount } from '../store';
import axios from 'axios';
import apiClient from '../api/axiosInstance';
// react-icons에서 사용할 아이콘들을 가져옵니다.
import {
    IoSend,
    IoAddCircleOutline,
    IoCameraOutline,
    IoArrowBack,
    IoLogOutOutline,
    IoTrashOutline,
    IoArrowForward
} from 'react-icons/io5';

// --- 타입 정의 ---
interface ChatMessage {
    type: 'ENTER' | 'TALK' | 'LEAVE' | 'IMAGE';
    roomId: string;
    sender: string;
    message: string;
    messageSeq?: number;
}

interface ChatRoomProps {
    roomId: string;
    onLeave: () => void;
}

interface RoomInfo {
    id: number;
    title: string;
    creator: string;
}

const ChatRoom = ({ roomId, onLeave }: ChatRoomProps) => {
    // --- 상태 변수 및 Redux 선택자 ---
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [lastMessageSeq, setLastMessageSeq] = useState<number>(0);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false); // '+' 버튼 옵션 메뉴 상태

    const clientRef = useRef<Client | null>(null);
    const lastMessageSeqRef = useRef(lastMessageSeq);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();

    const API_URL = process.env.REACT_APP_API_URL;

    // --- useEffect 훅: lastMessageSeq 동기화 ---
    useEffect(() => {
        lastMessageSeqRef.current = lastMessageSeq;
    }, [lastMessageSeq]);

    // --- 헬퍼 함수: 백엔드 API 호출 (기존과 동일) ---
    const updateLastReadSequence = async (seqToUpdate: number) => {
        if (!userName) return;
        try {
            await apiClient.post(`chat/rooms/update-status`, { roomId, username: userName, lastReadSeq: seqToUpdate });
            console.log(`[읽음 처리/참여 기록] Room: ${roomId}, User: ${userName}, LastReadSeq: ${seqToUpdate}`);
        } catch (error) {
            console.error("읽음 상태 갱신/참여 기록에 실패했습니다.", error);
        }
    };
    const fetchRoomInfo = async () => {
        try {
            const response = await apiClient.get<RoomInfo>(`chat/rooms/${roomId}`);
            setRoomInfo(response.data);
        } catch (error) {
            console.error("채팅방 정보를 가져오는 데 실패했습니다.", error);
        }
    };
    const fetchPreviousMessages = async (): Promise<ChatMessage[]> => {
        try {
            const response = await apiClient.get<ChatMessage[]>(`chat/rooms/${roomId}/messages?size=50`);
            const fetchedMessages = Array.isArray(response.data) ? response.data : [];
            setMessages(fetchedMessages);
            if (fetchedMessages.length > 0) {
                const lastSeq = fetchedMessages[fetchedMessages.length - 1].messageSeq;
                if (lastSeq) setLastMessageSeq(lastSeq);
            }
            return fetchedMessages;
        } catch (error) {
            console.error("이전 대화 내역을 불러오는 데 실패했습니다.", error);
            setMessages([]);
            return [];
        }
    };

    // --- 메인 useEffect 훅 (기존과 거의 동일) ---
    useEffect(() => {
        const token = store.getState().token.token;
        if (!userName || !token) return;

        const initializeAndConnect = async () => {
            if (!userName) return;
            await fetchRoomInfo();
            const previousMessages = await fetchPreviousMessages();
            const lastSeq = previousMessages.length > 0 ? previousMessages[previousMessages.length - 1].messageSeq ?? 0 : 0;
            await updateLastReadSequence(lastSeq);
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
                    body: JSON.stringify({ roomId, sender: userName, type: 'LEAVE' }),
                });
                clientRef.current.deactivate();
                console.log('STOMP 연결이 비활성화되었습니다.');
            }
        };
    }, [roomId, userName]);

    // --- 웹소켓 및 메시지 관련 함수 (기존과 동일) ---
    const connectWebSocket = () => {
        const client = new Client({
            connectHeaders: { Authorization: `${store.getState().token.token}` },
            webSocketFactory: () => new SockJS(`${API_URL}/ws-stomp`),
            reconnectDelay: 5000,
            debug: (str) => { console.log(new Date(), str); },
            onConnect: () => {
                console.log('STOMP 연결 성공!');
                clientRef.current = client;
                client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body) as ChatMessage;
                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    if (receivedMessage.messageSeq) {
                        setLastMessageSeq(receivedMessage.messageSeq);
                    }
                });
                client.publish({
                    destination: '/api/pub/chat/enter',
                    body: JSON.stringify({ roomId, sender: userName, type: 'ENTER' }),
                });
            },
            onStompError: (frame) => { console.error('STOMP Error:', frame); },
        });
        client.activate();
    };
    const sendMessage = () => {
        if (inputMessage.trim() && clientRef.current?.connected && userName) {
            clientRef.current.publish({
                destination: '/api/pub/chat/message',
                body: JSON.stringify({ roomId, sender: userName, message: inputMessage, type: 'TALK' }),
            });
            setInputMessage('');
        }
    };
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
                    body: JSON.stringify({ roomId, sender: userName, message: imageUrl, type: 'IMAGE' }),
                });
            }
            setIsOptionsOpen(false); // ✅ 이미지 전송 후 옵션 메뉴 닫기
        } catch (error) {
            console.error("이미지 업로드에 실패했습니다.", error);
            alert("이미지 전송에 실패했습니다.");
        }
        if (e.target) e.target.value = '';
    };

    // --- UI 이벤트 핸들러 및 렌더링 최적화 (기존과 동일) ---
    const handleImageIconClick = () => {
        fileInputRef.current?.click();
        setIsOptionsOpen(false); // ✅ 사진 아이콘 클릭시 옵션 메뉴 닫기
    };

    // ✅ 다른 곳 클릭시 옵션 메뉴 닫기
    const handleOutsideClick = () => {
        if (isOptionsOpen) {
            setIsOptionsOpen(false);
        }
    };
    const handleLeaveRoom = async () => {
        if (!userName) return;
        try {
            await apiClient.post(`chat/rooms/${roomId}/leave`, { username: userName });
            onLeave();
        } catch (error) {
            console.error("채팅방 나가기에 실패했습니다.", error);
            alert("채팅방을 나가는 중 오류가 발생했습니다.");
        }
    };
    const handleDeleteRoom = async () => {
        if (!userName || !window.confirm("정말로 이 방을 삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`chat/rooms/${roomId}`, { data: { username: userName } });
            alert("채팅방이 삭제되었습니다.");
            onLeave();
        } catch (error) {
            console.error("방 삭제에 실패했습니다.", error);
            alert("방을 삭제하는 중 오류가 발생했습니다.");
        }
    };
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // --- JSX 렌더링 ---
    return (
        <div style={{
            maxWidth: '950px', // 가로 폭 살짝 늘림//채팅방 가로폭
            margin: '20px auto',
            padding: '20px',
            border: '1px solid #e9ecef', // 테두리 색상 흐리게 변경
            borderRadius: '12px', // 좀 더 둥글게
            display: 'flex',
            flexDirection: 'column',
            height: '90vh',
            backgroundColor: '#fff' // 배경색 추가
        }} onClick={handleOutsideClick}> {/* ✅ 다른 곳 클릭시 옵션 메뉴 닫기 */}
            {/* 상단 헤더: 스타일 개선 */}
            <div style={{
                backgroundColor: 'transparent', // ✅ 투명 배경
                padding: '15px 0', // 좌우 패딩 제거
                marginBottom: '20px',
                position: 'relative'
            }}>
                {/* 버튼들을 왼쪽 상단에 원형으로 배치 */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 10
                }}>
                    {/* 로비로 돌아가기 버튼 */}
                    <button
                        onClick={onLeave}
                        title="로비로 나가기" // 툴팁 추가
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <IoArrowBack size={20} color="#a0a0a0" />
                    </button>

                    {/* 채팅방 나가기 버튼 */}
                    <button
                        onClick={handleLeaveRoom}
                        title="방에서 나가기" // 툴팁 추가
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <IoLogOutOutline
                            size={20}
                            color="#a0a0a0"
                            style={{ transform: 'rotate(180deg)' }} // 왼쪽을 향하도록 180도 회전
                        />
                    </button>

                    {/* 방 삭제 버튼 (개설자만) */}
                    {userName === roomInfo?.creator && (
                        <button
                            onClick={handleDeleteRoom}
                            title="방 삭제하기" // 툴팁 추가
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <IoTrashOutline size={20} color="#a0a0a0" />
                        </button>
                    )}
                </div>

                {/* 채팅방 정보는 중앙에 배치 */}
                <div style={{ textAlign: 'center', paddingTop: '50px' }}>
                    {roomInfo ? (
                        <div>
                            <h2 style={{ margin: '0 0 8px 0', color: '#343a40' }}>
                                {roomInfo.title} <span style={{ color: '#6c757d', fontSize: '18px' }}>#{roomInfo.id}</span>
                            </h2>
                            <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>개설자: {roomInfo.creator}</p>
                        </div>
                    ) : (
                        <h2 style={{ margin: '0', color: '#6c757d' }}>채팅방 정보 로딩 중...</h2>
                    )}
                </div>
            </div>

            {/* 메시지 목록: 기존과 동일 */}
            <div ref={messageContainerRef} style={{ flexGrow: 1, overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{
                        textAlign: msg.sender === userName ? 'right' : 'left',
                        margin: '15px 0',
                        marginLeft: msg.sender === userName ? '0' : '0', // ✅ 기본 왼쪽 여백
                        marginRight: msg.sender === userName ? '0' : '60px' // ✅ 다른 사용자 메시지는 오른쪽에 60px 여백
                    }}>
                        <small style={{ marginRight: '8px'}}>{msg.sender}</small> {/*display: 'block' 넣으면 단독 분리 됨*/}
                        <div style={{
                            display: 'inline-block',
                            padding: msg.type === 'IMAGE' ? '0px' : '8px 12px',
                            borderRadius: '18px',
                            maxWidth: '70%',
                            marginTop: '8px', // ✅ 유저네임과 메시지창 간격 더 늘림 (8px로 증가)
                            backgroundColor: msg.type === 'IMAGE' ? 'transparent' : (msg.type === 'ENTER' || msg.type === 'LEAVE' ? '#FFFACD' : (msg.sender === userName ? '#DCF8C6' : '#EAEAEA'))
                        }}>
                            {msg.type === 'IMAGE' ? (
                                <img
                                    src={msg.message}
                                    alt="채팅 이미지"
                                    style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer', display: 'block' }}
                                    onClick={() => window.open(msg.message, '_blank')}
                                />
                            ) : (
                                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{msg.message}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ====== 하단 입력창 UI 수정 ====== */}
            <div style={{ position: 'relative' }}>
                {/* '+' 버튼 클릭 시 나타나는 옵션 메뉴 */}
                {isOptionsOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '60px', // 입력창 바로 위에 위치
                            left: '1px', // ✅ 오른쪽으로 1px 이동
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            padding: '8px',
                            display: 'flex',
                            gap: '8px'
                        }}
                        onClick={(e) => e.stopPropagation()} // ✅ 이벤트 버블링 방지
                    >
                        {/* 카메라 아이콘 버튼 */}
                        <button onClick={handleImageIconClick} style={iconButtonStyle}>
                            <IoCameraOutline size={24} color="#a0a0a0" />
                        </button>
                        {/* ✨ 확장성: 나중에 여기에 다른 아이콘 버튼들을 추가하면 됩니다.
                           <button style={iconButtonStyle}><IoDocumentTextOutline size={24} /></button>
                           <button style={iconButtonStyle}><IoLocationOutline size={24} /></button>
                        */}
                    </div>
                )}

                {/* 메시지 입력 바 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    backgroundColor: '#f0f2f5', // 입력창 배경색
                    borderRadius: '24px', // 둥근 모서리
                    height: '40px'
                }}>
                    {/* + 아이콘 버튼 */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // ✅ 이벤트 버블링 방지
                            setIsOptionsOpen(!isOptionsOpen);
                        }}
                        style={iconButtonStyle}
                    >
                        <IoAddCircleOutline size={28} color="#a0a0a0" />
                    </button>

                    {/* 파일 입력을 위한 숨겨진 input */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />

                    {/* 텍스트 입력 필드 */}
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="메시지를 입력하세요"
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: '16px',
                            marginLeft: '8px',
                            marginRight: '8px'
                        }}
                    />

                    {/* 전송(비행기) 아이콘 버튼 */}
                    <button onClick={sendMessage} style={iconButtonStyle} disabled={!inputMessage.trim()}>
                        <IoSend size={24} color={inputMessage.trim() ? '#007bff' : '#a0a0a0'} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// 아이콘 버튼을 위한 공통 스타일
const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
};

export default ChatRoom;