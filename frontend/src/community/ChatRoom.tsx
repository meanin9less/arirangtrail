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

interface RoomInfo {
    id: number;
    title: string;
    creator: string;
    // 참여인원은 나중에 추가
}

const ChatRoom = ({ roomId, userName, onLeave }: ChatRoomProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const clientRef = useRef<Client | null>(null);
    const [lastMessageSeq, setLastMessageSeq] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // ★ 자동 스크롤을 위한 ref 추가/1,2
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // 이 ref는 항상 최신 lastMessageSeq 값을 담고 있을 것입니다.
    const lastMessageSeqRef = useRef(lastMessageSeq);
    // 채팅방 정보를 담을 상태를 추가합니다.
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);



    // --- 자동 스크롤 기능 ---
    const scrollToBottom = () => {
        if (messageContainerRef.current) {
            // messageContainer의 스크롤 위치를, 컨테이너의 전체 높이로 설정합니다.
            // 이렇게 하면 항상 스크롤이 해당 div의 맨 아래로 이동합니다.
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // 메시지 목록이 업데이트될 때마다 스크롤을 맨 아래로 이동
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        lastMessageSeqRef.current = lastMessageSeq;
    }, [lastMessageSeq]);

    //라스트 메세지를 0이 아닌 고정값으로 가져오기
    useEffect(() => {
        lastMessageSeqRef.current = lastMessageSeq;
    }, [lastMessageSeq]);

    // ★ --- UserChatStatus의 seq를 갱신하는 로직 ---
    const updateLastReadSequence = async () => {
        // 이제 '사진 속 값'이 아닌, '현재 값'을 사용합니다.
        if (lastMessageSeqRef.current === 0) return;

        try {
            await axios.post('http://localhost:8080/api/chat/rooms/update-status', {
                roomId: roomId,
                username: userName,
                lastReadSeq: lastMessageSeqRef.current, // ref의 현재 값을 사용
            });
            console.log(`[Seq 갱신] Room: ${roomId}, User: ${userName}, LastReadSeq: ${lastMessageSeqRef.current}`);
        } catch (error) {
            console.error("마지막 읽은 메시지 순번(seq) 갱신에 실패했습니다.", error);
        }
    };

    useEffect(() => {
        // 채팅방 정보를 가져오는 함수를 만듭니다.
        const fetchRoomInfo = async () => {
            try {
                const response = await axios.get<RoomInfo>(`http://localhost:8080/api/chat/rooms/${roomId}`);
                setRoomInfo(response.data);
            } catch (error) {
                console.error("채팅방 정보를 가져오는 데 실패했습니다.", error);
            }
        };

        const fetchPreviousMessages = async () => {
            try {
                const response = await axios.get<ChatMessage[]>(
                    `http://localhost:8080/api/chat/rooms/${roomId}/messages?size=50`
                );
                // 서버에서 받은 response.data가 정말 배열인지 확인합니다.
                if (Array.isArray(response.data)) {
                    // 배열이 맞을 경우에만 상태를 업데이트합니다.
                    setMessages(response.data);

                    if (response.data.length > 0) {
                        const lastSeq = response.data[response.data.length - 1].messageSeq;
                        if (lastSeq) {
                            setLastMessageSeq(lastSeq);
                        }
                    }
                } else {
                    // 배열이 아닐 경우, 콘솔에 경고를 남기고 빈 배열로 안전하게 초기화합니다.
                    console.warn("서버로부터 배열이 아닌 데이터가 수신되었습니다:", response.data);
                    setMessages([]);
                }
            } catch (error) {
                console.error("이전 대화 내역을 불러오는 데 실패했습니다.", error);
                setMessages([]); // 에러 발생 시 빈 배열로 초기화
            }
        };
        // 웹소켓 엔드api에 접속하여 기본적인 구독 설정 및 메세지 관련 동작
        // WebSocket 연결 로직
        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),//api 설정
                reconnectDelay: 5000,
                debug: (str) => { console.log(new Date(), str); },
                onConnect: () => {
                    console.log('연결 성공!');
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        // ★★★★★★★★★★★★★ 이 한 줄을 추가하세요 ★★★★★★★★★★★★★
                        console.log("서버로부터 받은 메시지 원본:", message.body);
                        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

                        const receivedMessage = JSON.parse(message.body) as ChatMessage;

                        // ★ 메시지를 받을 때마다 messageSeq 갱신
                        if (receivedMessage.messageSeq && receivedMessage.messageSeq > lastMessageSeq) {
                            setLastMessageSeq(receivedMessage.messageSeq);
                        }

                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    });
                    client.publish({// 입장
                        destination: '/api/pub/chat/enter',
                        body: JSON.stringify({ roomId, sender: userName, type: 'ENTER' }),
                    });
                },
                onStompError: (frame) => { console.error('STOMP Error:', frame); },
            });
            client.activate();
            clientRef.current = client;
        };
        fetchRoomInfo();
        fetchPreviousMessages().then(() => {
            // 2. 대화 내역 로딩이 완료된 후에 WebSocket 연결을 시작한다.
            connect();
        });

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
    }, [roomId, userName]);

    const sendMessage = () => {
        if (inputMessage.trim() && clientRef.current?.connected) {
            // 어떠한 axios 호출도 없이, 순수하게 메시지 내용만 publish 합니다.
            clientRef.current.publish({
                destination: '/api/pub/chat/message', // STOMP 메시지 목적지
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

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. FormData 객체 생성
        const formData = new FormData();
        formData.append('file', file); // 'file'이라는 키는 컨트롤러의 파라미터 이름과 일치해야 함

        try {
            // 2. 파일을 백엔드의 '/api/files/upload' API로 전송
            const response = await axios.post<{ url: string }>(
                'http://localhost:8080/api/files/upload',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            // 3. 성공적으로 업로드 후, 응답으로 받은 이미지 URL 추출
            const imageUrl = response.data.url;

            // 4. WebSocket을 통해 이미지 URL을 메시지로 전송
            if (clientRef.current?.connected) {
                clientRef.current.publish({
                    destination: '/api/pub/chat/message',
                    body: JSON.stringify({
                        roomId,
                        sender: userName,
                        message: imageUrl, // ★ 메시지 내용에 URL을 담음
                        type: 'IMAGE',     // ★ 타입을 'IMAGE'로 지정
                    }),
                });
            }
        } catch (error) {
            console.error("이미지 업로드에 실패했습니다.", error);
            alert("이미지 전송에 실패했습니다.");
        }

        // 파일 선택 후 입력창 초기화
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleImageIconClick = () => {
        fileInputRef.current?.click();
    };

    // ★★★ 채팅방 나가기 버튼 핸들러 함수 ★★★
    const handleLeaveRoom = async () => {
        try {
            // 1. 백엔드에 '나가기' 요청을 보냅니다.
            await axios.post(`http://localhost:8080/api/chat/rooms/${roomId}/leave`, {
                username: userName
            });

            // 2. 요청 성공 시, 부모 컴포넌트가 전달해준 onLeave 함수를 호출하여 페이지를 닫습니다.
            onLeave();

        } catch (error) {
            console.error("채팅방 나가기에 실패했습니다.", error);
            // 실패하더라도 일단 방을 나가게 할지, 아니면 사용자에게 알릴지 결정
            alert("채팅방을 나가는 중 오류가 발생했습니다.");
        }
    };


    const handleDeleteRoom = async () => {
        if (!window.confirm("정말로 이 방을 삭제하시겠습니까? 모든 대화 내용이 사라집니다.")) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/api/chat/rooms/${roomId}`, {
                // DELETE 요청 시 body를 보내려면 data 속성 안에 넣어야 합니다.
                data: { username: userName }
            });
            alert("채팅방이 삭제되었습니다.");
            onLeave(); // 방이 사라졌으므로 로비로 이동
        } catch (error) {
            console.error("방 삭제에 실패했습니다.", error);
            alert("방을 삭제하는 중 오류가 발생했습니다.");
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
            <div>
                <button onClick={onLeave}>← 로비로 돌아가기</button>
                <button onClick={handleLeaveRoom}>← 채팅방에서 나가기</button>
                {roomInfo ? (
                    <div>
                        <h2>{roomInfo.title} (#{roomInfo.id})</h2>
                        <p>개설자: {roomInfo.creator}</p>

                        {/* ★★★ 방장에게만 보이는 삭제 버튼 ★★★ */}
                        {userName === roomInfo.creator && (
                            <button onClick={handleDeleteRoom}>
                                방 삭제
                            </button>
                        )}
                    </div>
                ) : (
                    <h2>채팅방 정보 로딩 중...</h2>
                )}
            </div>

            {/* ★ 메시지 목록 UI 변경: flex-grow를 사용하여 남은 공간을 모두 차지하도록 함 */}
            <div ref={messageContainerRef}
                 style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.sender === userName ? 'right' : 'left', margin: '5px 0' }}>
                        <small>{msg.sender}</small>
                        <div style={{ display: 'inline-block', padding: '8px', borderRadius: '10px', backgroundColor: msg.type === 'ENTER' ? '#FFFACD' : (msg.sender === userName ? '#DCF8C6' : '#EAEAEA') }}>
                            {msg.type === 'IMAGE' ? (
                                <img
                                    src={msg.message} // 메시지에 담긴 URL을 src로 사용
                                    alt="채팅 이미지"
                                    style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
                                    onClick={() => window.open(msg.message, '_blank')}
                                />
                            ) : (
                                <span>{msg.message}</span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ display: 'flex' }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange} // ★ 완성된 함수 연결
                    style={{ display: 'none' }}
                    accept="image/*" // 이미지 파일만 선택하도록 제한
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