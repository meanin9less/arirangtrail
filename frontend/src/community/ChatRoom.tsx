import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

// 타입 정의 (변경 없음)
interface ChatMessage {
    type: 'ENTER' | 'TALK' | 'LEAVE' | 'IMAGE';
    roomId: string;
    sender: string;
    message: string;
    messageSeq?: number;
}

interface ChatRoomProps {
    roomId: string;
    userName: string;
    onLeave: () => void;
}

const ChatRoom = ({ roomId, userName, onLeave }: ChatRoomProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const clientRef = useRef<Client | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // ★ 자동 스크롤을 위한 ref 추가
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ★ 마지막으로 받은 메시지의 sequence를 저장하는 상태 추가
    const [lastMessageSeq, setLastMessageSeq] = useState<number>(0);

    // --- 자동 스크롤 기능 ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // 메시지 목록이 업데이트될 때마다 스크롤을 맨 아래로 이동
        scrollToBottom();
    }, [messages]);


    // ★ --- UserChatStatus의 seq를 갱신하는 로직 ---
    const updateLastReadSequence = async () => {
        // 갱신할 seq가 없으면 함수 종료 (메시지가 하나도 없을 경우)
        if (lastMessageSeq === 0) return;

        try {
              await axios.post('http://localhost:8080/api/chat/rooms/update-status', {
                roomId: roomId,
                username: userName, // Spring Security 등에서 Principal로 사용자 식별이 가능하다면 이 필드는 불필요
                lastReadSeq: lastMessageSeq
            });
            console.log(`[Seq 갱신] Room: ${roomId}, User: ${userName}, LastReadSeq: ${lastMessageSeq}`);
        } catch (error) {
            console.error("마지막 읽은 메시지 순번(seq) 갱신에 실패했습니다.", error);
        }
    };
    //테스트
    // useEffect(  () => {
    //     try{
    //         const response= await axios.post(`http://localhost:8080/api/chat/rooms/${roomId}`
    //         );
    //         console.log(`[Seq 갱신] Room: ${roomId},LastReadSeq: ${response.data}`);
    //     }catch (e){
    //         e.
    //     }
    //
    // }, []);

    useEffect(() => {
        // WebSocket 연결 로직
        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),//api 설정
                reconnectDelay: 5000,
                debug: (str) => { console.log(new Date(), str); },
                onConnect: () => {
                    console.log('연결 성공!');
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body) as ChatMessage;

                        // ★ 메시지를 받을 때마다 messageSeq 갱신
                        if (receivedMessage.messageSeq && receivedMessage.messageSeq > lastMessageSeq) {
                            setLastMessageSeq(receivedMessage.messageSeq);
                        }

                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    });
                    client.publish({
                        destination: '/api/pub/chat/message',
                        body: JSON.stringify({ roomId, sender: userName, type: 'ENTER' }),
                    });
                },
                onStompError: (frame) => { console.error('STOMP Error:', frame); },
            });
            client.activate();
            clientRef.current = client;
        };

        connect();

        // ★ 주기적으로 seq 갱신 API 호출
        const seqUpdateInterval = setInterval(() => {
            updateLastReadSequence();
        }, 10000); // 10초마다 갱신 (서버 부하를 고려하여 시간 조절)

        return () => {
            // 컴포넌트 언마운트 시 seq 최종 갱신
            updateLastReadSequence();

            // 인터벌 클리어
            clearInterval(seqUpdateInterval);

            if (clientRef.current?.connected) {
                // LEAVE 메시지 전송 로직이 필요하다면 여기에 추가
                clientRef.current.deactivate();
                console.log('연결 종료됨.');
            }
        };
    }, [roomId, userName, lastMessageSeq]); // lastMessageSeq를 dependency 배열에 추가

    const sendMessage =
    async () => {
        if (inputMessage.trim() && clientRef.current?.connected) {
            try {
                const response= await axios.post(`http://localhost:8080/api/chat/rooms/${roomId}`
                );
                console.log(`[Seq 갱신] Room: ${roomId},LastReadSeq: ${response.data}`);
            } catch (error) {
                console.error("마지막 읽은 메시지 순번(seq) 갱신에 실패했습니다.", error);
            }
            clientRef.current.publish({
                destination: '/api/pub/chat/message',
                body: JSON.stringify({ roomId, sender: userName, message: inputMessage, type: 'TALK' }),
            });
            setInputMessage('');
        }
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        // (기존 코드와 동일)
    };

    const handleImageIconClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
            <div>
                <button onClick={onLeave}>← 로비로 돌아가기</button>
                <h2>채팅방: {roomId}</h2>
            </div>

            {/* ★ 메시지 목록 UI 변경: flex-grow를 사용하여 남은 공간을 모두 차지하도록 함 */}
            <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.sender === userName ? 'right' : 'left', margin: '5px 0' }}>
                        <small>{msg.sender}</small>
                        <div style={{ display: 'inline-block', padding: '8px', borderRadius: '10px', backgroundColor: msg.type === 'ENTER' ? '#FFFACD' : (msg.sender === userName ? '#DCF8C6' : '#EAEAEA') }}>
                            {msg.type === 'IMAGE' ? (
                                <img src={msg.message} alt="채팅 이미지" style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.message, '_blank')} />
                            ) : (
                                <span>{msg.message}</span>
                            )}
                        </div>
                    </div>
                ))}
                {/* ★ 스크롤의 기준점이 될 div */}
                <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력창 (변경 없음) */}
            <div style={{ display: 'flex' }}>
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