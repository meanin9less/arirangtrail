import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios'; // ★ 1. axios를 import 합니다.

// 메시지 타입 정의 확장
interface ChatMessage {
    type: 'ENTER' | 'TALK' | 'LEAVE' | 'IMAGE'; // ★ 2. IMAGE 타입을 추가합니다.
    roomId: string;
    sender: string;
    message: string;
    messageSeq?: number; // messageSeq도 받을 수 있도록 추가 (선택 사항)
}

// Props 타입 정의
interface ChatRoomProps {
    roomId: string;
    userName: string;
    onLeave: () => void;
}

const ChatRoom = ({ roomId, userName, onLeave }: ChatRoomProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const clientRef = useRef<Client | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // ★ 3. 파일 input에 접근하기 위한 ref

    useEffect(() => {
        // WebSocket 연결 로직 (이 부분은 변경 없음)
        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),
                reconnectDelay: 5000,
                debug: (str) => { console.log(new Date(), str); },
                onConnect: () => {
                    console.log('연결 성공!');
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body) as ChatMessage;
                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    });
                    client.publish({
                        destination: '/api/pub/chat/message', // 입장 메시지도 /message로 통일 (백엔드 로직에 따라 다름)
                        body: JSON.stringify({ roomId, sender: userName, message: `${userName}님이 입장하셨습니다.`, type: 'ENTER' }),
                    });
                },
                onStompError: (frame) => { console.error('브로커가 STOMP 에러를 반환했습니다:', frame); },
            });
            client.activate();
            clientRef.current = client;
        };

        connect();

        return () => {
            if (clientRef.current?.connected) {
                clientRef.current.deactivate();
                console.log('연결 종료됨.');
            }
        };
    }, [roomId, userName]);

    // 텍스트 메시지 전송 함수
    const sendMessage = () => {
        if (inputMessage.trim() && clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/api/pub/chat/message',
                body: JSON.stringify({
                    roomId,
                    sender: userName,
                    message: inputMessage,
                    type: 'TALK', // ★ 4. 텍스트 메시지는 'TALK' 타입으로 명시
                }),
            });
            setInputMessage('');
        }
    };

    // ★★★★★ 5. 이미지 파일 업로드 및 전송 함수 (핵심 추가 부분) ★★★★★
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // FormData 객체 생성
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. 백엔드 파일 업로드 API로 FormData 전송
            const response = await axios.post<string>('http://localhost:8080/api/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // 2. 응답으로 받은 이미지 URL을 꺼냄
            const imageUrl = response.data;

            // 3. 접속되어 있다면, 해당 URL을 WebSocket 메시지로 전송
            if (clientRef.current?.connected) {
                clientRef.current.publish({
                    destination: '/api/pub/chat/message',
                    body: JSON.stringify({
                        roomId,
                        sender: userName,
                        message: imageUrl, // 메시지 내용이 바로 이미지 URL
                        type: 'IMAGE',     // 타입은 'IMAGE'로 지정
                    }),
                });
            }
        } catch (error) {
            console.error("이미지 업로드에 실패했습니다.", error);
            alert("이미지 업로드에 실패했습니다.");
        }
    };

    // 이미지 아이콘 클릭 시 파일 선택창을 띄우는 함수
    const handleImageIconClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <button onClick={onLeave}>← 로비로 돌아가기</button>
            <h2>채팅방: {roomId}</h2>

            {/* 메시지 목록 (렌더링 부분 수정) */}
            <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.sender === userName ? 'right' : 'left', margin: '5px 0' }}>
                        <small>{msg.sender}</small>
                        <div style={{ display: 'inline-block', padding: '8px', borderRadius: '10px', backgroundColor: msg.type === 'ENTER' ? '#FFFACD' : (msg.sender === userName ? '#DCF8C6' : '#EAEAEA') }}>
                            {/* ★ 6. 메시지 타입에 따라 분기 처리하여 렌더링 */}
                            {msg.type === 'IMAGE' ? (
                                <img src={msg.message} alt="채팅 이미지" style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.message, '_blank')} />
                            ) : (
                                <span>{msg.message}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 메시지 입력창 (UI 수정) */}
            <div style={{ display: 'flex' }}>
                {/* ★ 7. 숨겨진 파일 입력 필드와 아이콘 버튼 추가 */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
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