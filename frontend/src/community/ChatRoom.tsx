import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 메시지 타입 정의
interface ChatMessage {
    type: 'ENTER' | 'TALK' | 'LEAVE';
    roomId: string;
    sender: string;
    message: string;
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

    useEffect(() => {
        // WebSocket 연결 로직
        const connect = () => {
            const client = new Client({
                // WebSocket 대신 SockJS 사용
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),
                reconnectDelay: 5000,
                debug: (str) => {
                    console.log(new Date(), str);
                },
                onConnect: () => {
                    console.log('연결 성공!');
                    // 1. 방 구독
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body) as ChatMessage;
                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    });

                    // 2. 입장 메시지 전송
                    client.publish({
                        destination: '/api/pub/chat/enter',
                        body: JSON.stringify({
                            roomId,
                            sender: userName,
                        }),
                    });
                },
                onStompError: (frame) => {
                    console.error('브로커가 STOMP 에러를 반환했습니다:', frame);
                },
            });

            client.activate();
            clientRef.current = client;
        };

        connect();

        // 컴포넌트 언마운트 시 연결 종료
        return () => {
            if (clientRef.current?.connected) {
                // 퇴장 메시지를 보내고 싶다면 여기서 publish
                clientRef.current.deactivate();
                console.log('연결 종료됨.');
            }
        };
    }, [roomId, userName]);

    // 메시지 전송 함수
    const sendMessage = () => {
        if (inputMessage.trim() && clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/api/pub/chat/message',
                body: JSON.stringify({
                    roomId,
                    sender: userName,
                    message: inputMessage,
                }),
            });
            setInputMessage('');
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
    <button onClick={onLeave}>← 로비로 돌아가기</button>
    <h2>채팅방: {roomId}</h2>

    {/* 메시지 목록 */}
    <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
    {messages.map((msg, index) => (
        <div key={index} style={{
        textAlign: msg.sender === userName ? 'right' : 'left',
            margin: '5px 0'
    }}>
        <small>{msg.sender}</small>
        <div style={{
        display: 'inline-block',
            padding: '8px',
            borderRadius: '10px',
            backgroundColor: msg.type === 'TALK' ? (msg.sender === userName ? '#DCF8C6' : '#EAEAEA') : '#FFFACD'
    }}>
        {msg.message}
        </div>
        </div>
    ))}
    </div>

    {/* 메시지 입력창 */}
    <div>
        <input
            type="text"
    value={inputMessage}
    onChange={(e) => setInputMessage(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && sendMessage()} // onKeyPress -> onKeyDown 으로 변경
    style={{ width: '80%', padding: '8px' }}
    />
    <button onClick={sendMessage} style={{ width: '18%', padding: '8px' }}>전송</button>
    </div>
    </div>
);
};

export default ChatRoom;