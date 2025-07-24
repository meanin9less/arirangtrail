import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // store 파일 경로에 맞게 수정해주세요.

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

    const clientRef = useRef<Client | null>(null);
    const lastMessageSeqRef = useRef(lastMessageSeq);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    const API_URL = process.env.REACT_APP_API_URL;

    // --- useEffect 훅: lastMessageSeq 동기화 ---
    useEffect(() => {
        lastMessageSeqRef.current = lastMessageSeq;
    }, [lastMessageSeq]);


    // --- 헬퍼 함수: 백엔드 API 호출 ---

    /**
     * 사용자의 '읽음' 상태를 갱신하고, 참여 기록(UserChatStatus)을 생성/업데이트합니다.
     * @param seqToUpdate 서버에 기록할 마지막으로 읽은 메시지 번호
     */
    const updateLastReadSequence = async (seqToUpdate: number) => {
        if (!userName) return;

        try {
            await axios.post(`${API_URL}/api/chat/rooms/update-status`, {
                roomId: roomId,
                username: userName,
                lastReadSeq: seqToUpdate,
            });
            console.log(`[읽음 처리/참여 기록] Room: ${roomId}, User: ${userName}, LastReadSeq: ${seqToUpdate}`);
        } catch (error) {
            console.error("읽음 상태 갱신/참여 기록에 실패했습니다.", error);
        }
    };

    /** 채팅방의 기본 정보를 불러옵니다. */
    const fetchRoomInfo = async () => {
        try {
            const response = await axios.get<RoomInfo>(`${API_URL}/api/chat/rooms/${roomId}`);
            setRoomInfo(response.data);
        } catch (error) {
            console.error("채팅방 정보를 가져오는 데 실패했습니다.", error);
        }
    };

    /**
     * 이전 대화 내역을 불러오고, 불러온 메시지 배열을 반환합니다.
     * @returns 불러온 메시지 배열
     */
    const fetchPreviousMessages = async (): Promise<ChatMessage[]> => {
        try {
            const response = await axios.get<ChatMessage[]>(`${API_URL}/api/chat/rooms/${roomId}/messages?size=50`);
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


    // --- 메인 useEffect 훅: 컴포넌트 초기화, 웹소켓 연결, 정리 ---
    useEffect(() => {
        /** 컴포넌트 마운트 시 실행될 비동기 초기화 함수 */
        const initializeAndConnect = async () => {
            if (!userName) return;

            // 1. 방 정보와 이전 메시지를 순서대로 불러옵니다.
            await fetchRoomInfo();
            const previousMessages = await fetchPreviousMessages();

            // 2. ✨ "입장 즉시 참여 기록" 핵심 로직
            // 불러온 메시지가 있다면 가장 마지막 번호로, 없다면 0으로 '읽음' 처리를 요청합니다.
            // 백엔드의 orElse() 로직 덕분에, 이 호출 한 번으로 참여 기록이 보장됩니다.
            const lastSeq = previousMessages.length > 0 ? previousMessages[previousMessages.length - 1].messageSeq ?? 0 : 0;
            await updateLastReadSequence(lastSeq);

            // 3. 모든 기록 작업이 끝난 후 웹소켓에 연결합니다.
            connectWebSocket();
        };

        initializeAndConnect();

        // 컴포넌트가 사라질 때는 웹소켓 연결만 깔끔하게 끊어줍니다.
        return () => {
            if (clientRef.current?.connected) {
                clientRef.current.deactivate();
                console.log('STOMP 연결이 비활성화되었습니다.');
            }
        };
    }, [roomId, userName]); // roomId나 userName이 바뀌면 재실행됩니다.


    // --- 웹소켓 및 메시지 관련 함수 ---

    /** WebSocket 연결을 설정하고 활성화합니다. */
    const connectWebSocket = () => {
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_URL}/ws-stomp`),
            reconnectDelay: 5000,
            debug: (str) => { console.log(new Date(), str); },
            onConnect: () => {
                console.log('STOMP 연결 성공!');
                clientRef.current = client;

                // 1. 이 채팅방의 메시지를 구독합니다.
                client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body) as ChatMessage;
                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    if (receivedMessage.messageSeq) {
                        setLastMessageSeq(receivedMessage.messageSeq);
                    }
                });

                // 2. 입장했음을 서버에 알립니다.
                client.publish({
                    destination: '/api/pub/chat/enter',
                    body: JSON.stringify({ roomId, sender: userName, type: 'ENTER' }),
                });
            },
            onStompError: (frame) => { console.error('STOMP Error:', frame); },
        });

        client.activate();
    };

    /** 텍스트 메시지를 전송합니다. */
    const sendMessage = () => {
        if (inputMessage.trim() && clientRef.current?.connected && userName) {
            clientRef.current.publish({
                destination: '/api/pub/chat/message',
                body: JSON.stringify({
                    roomId,
                    sender: userName,
                    message: inputMessage,
                    type: 'TALK',
                }),
            });
            setInputMessage('');
        }
    };

    /** 이미지 파일을 업로드하고, URL을 메시지로 전송합니다. */
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userName) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post<{ url: string }>(`${API_URL}/api/files/upload`, formData);
            const imageUrl = response.data.url;

            if (clientRef.current?.connected) {
                clientRef.current.publish({
                    destination: '/api/pub/chat/message',
                    body: JSON.stringify({
                        roomId,
                        sender: userName,
                        message: imageUrl,
                        type: 'IMAGE',
                    }),
                });
            }
        } catch (error) {
            console.error("이미지 업로드에 실패했습니다.", error);
            alert("이미지 전송에 실패했습니다.");
        }
        if (e.target) e.target.value = '';
    };


    // --- UI 이벤트 핸들러 및 렌더링 최적화 ---

    const handleImageIconClick = () => fileInputRef.current?.click();

    /** 채팅방 나가기 (참여 기록만 삭제) */
    const handleLeaveRoom = async () => {
        if (!userName) return;
        try {
            await axios.post(`${API_URL}/api/chat/rooms/${roomId}/leave`, { username: userName });
            onLeave();
        } catch (error) {
            console.error("채팅방 나가기에 실패했습니다.", error);
            alert("채팅방을 나가는 중 오류가 발생했습니다.");
        }
    };

    /** 채팅방 삭제 (방장 권한) */
    const handleDeleteRoom = async () => {
        if (!userName || !window.confirm("정말로 이 방을 삭제하시겠습니까? 모든 대화 내용이 사라집니다.")) return;
        try {
            await axios.delete(`${API_URL}/api/chat/rooms/${roomId}`, { data: { username: userName } });
            alert("채팅방이 삭제되었습니다.");
            onLeave();
        } catch (error) {
            console.error("방 삭제에 실패했습니다.", error);
            alert("방을 삭제하는 중 오류가 발생했습니다.");
        }
    };

    /** 메시지 목록이 변경될 때마다 맨 아래로 스크롤 */
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);


    // --- JSX 렌더링 ---
    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
            {/* 상단 헤더: 방 정보 및 버튼 */}
            <div>
                <button onClick={onLeave}>← 로비로 돌아가기</button>
                <button onClick={handleLeaveRoom}>채팅방 나가기</button>
                {roomInfo ? (
                    <div>
                        <h2>{roomInfo.title} (#{roomInfo.id})</h2>
                        <p>개설자: {roomInfo.creator}</p>
                        {userName === roomInfo.creator && (
                            <button onClick={handleDeleteRoom} style={{ color: 'red' }}>방 삭제</button>
                        )}
                    </div>
                ) : (
                    <h2>채팅방 정보 로딩 중...</h2>
                )}
            </div>

            {/* 메시지 목록 */}
            <div ref={messageContainerRef} style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.sender === userName ? 'right' : 'left', margin: '5px 0' }}>
                        <small>{msg.sender}</small>
                        <div style={{
                            display: 'inline-block',
                            padding: msg.type === 'IMAGE' ? '0px' : '8px',
                            borderRadius: '10px',
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
                                <span>{msg.message}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 하단 입력창 */}
            <div style={{ display: 'flex' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                <button onClick={handleImageIconClick} style={{ marginRight: '5px' }}>🖼️</button>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    style={{ flex: 1, padding: '8px' }}
                />
                <button onClick={sendMessage} style={{ marginLeft: '5px', padding: '8px' }}>전송</button>
            </div>
        </div>
    );
};

export default ChatRoom;