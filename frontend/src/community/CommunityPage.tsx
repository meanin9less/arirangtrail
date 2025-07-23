import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import ChatRoom from './ChatRoom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// 백엔드의 DTO와 일치하는 인터페이스 (participantCount 포함 확인)
interface Room {
    id: number;
    title: string;
    creator: string;
    participantCount: number;
}

const CommunityPage = () => {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;

    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [myRoomIds, setMyRoomIds] = useState<number[]>([]);

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchRooms = async () => {
        try {
            const response = await axios.get<Room[]>(`${API_URL}/api/chat/rooms`);
            setRooms(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("채팅방 목록을 불러오는 데 실패했습니다.", error);
        }
    };

    const fetchMyRooms = async () => {
        if (!userName) return;
        try {
            const response = await axios.get<number[]>(`${API_URL}/api/chat/rooms/my-rooms`, {
                params: { username: userName }
            });
            setMyRoomIds(response.data);
        } catch (error) {
            console.error("내 채팅방 목록을 가져오는 데 실패했습니다.", error);
        }
    };

    // 로비 업데이트를 위한 웹소켓 구독
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_URL}/ws-stomp`),
            reconnectDelay: 10000,
            onConnect: () => {
                console.log('로비 웹소켓 연결 성공!');
                client.subscribe('/sub/chat/lobby', (message) => {
                    console.log('로비 정보 업데이트 신호 수신:', message.body);
                    // 신호를 받으면 방 목록과 내 방 정보를 모두 새로고침
                    fetchRooms();
                    fetchMyRooms();
                });
            },
            onStompError: (frame) => console.error('로비 웹소켓 연결 오류:', frame),
        });
        client.activate();
        return () => {
            client.deactivate();
            console.log('로비 웹소켓 연결 종료.');
        };
    }, []);

    // 사용자 로그인 시 데이터 로딩
    useEffect(() => {
        if (userName) {
            fetchRooms();
            fetchMyRooms();
        }
    }, [userName]);

    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim() || !userName) return;
        try {
            await axios.post<Room>(`${API_URL}/api/chat/rooms`, { title: newRoomName, username: userName });
            setNewRoomName('');
            // 생성 후에는 서버가 로비에 신호를 보내므로, 별도로 fetch 호출 안해도 됨 (또는 해도 됨)
            // fetchRooms();
            // fetchMyRooms();
        } catch (error) {
            console.error("채팅방 생성에 실패했습니다.", error);
        }
    };

    const handleEnterRoom = (roomId: string) => {
        if (!userName) return;
        setSelectedRoomId(roomId);
    };

    const handleLeaveRoom = () => {
        setSelectedRoomId(null);
        // 채팅방에서 로비로 돌아올 때는 목록을 최신으로 유지하기 위해 직접 호출
        fetchRooms();
        fetchMyRooms();
    };

    const myRooms = rooms.filter(room => myRoomIds.includes(room.id));
    const otherRooms = rooms.filter(room => !myRoomIds.includes(room.id));

    if (selectedRoomId) {
        return <ChatRoom roomId={selectedRoomId} onLeave={handleLeaveRoom} />;
    }

    if (!userName) {
        return <div>로그인 후 이용 가능합니다.</div>;
    }

// 이 부분은 CommunityPage.tsx의 return 문 전체입니다.
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>아리랑 트레일 커뮤니티</h1>
                <p><strong>{userName}</strong>님, 환영합니다.</p>
            </header>

            <section style={styles.section}>
                <h2>새로운 채팅방 만들기</h2>
                <form onSubmit={handleCreateRoom} style={styles.form}>
                    <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="새 채팅방 이름" style={styles.input} />
                    <button type="submit" style={styles.button}>만들기</button>
                </form>
            </section>

            {/* --- '내 채팅방' 섹션 --- */}
            <section style={styles.section}>
                <h2>내 채팅방</h2>
                {/* 조건부 렌더링을 <table> 태그 바깥에서 처리하여, table 내부 구조를 깨끗하게 유지합니다. */}
                {myRooms.length > 0 ? (
                    <table style={styles.roomTable}>
                        <thead>
                        {/* <tr> 바로 다음에 공백 없이 <th>가 오도록 합니다. */}
                        <tr>
                            <th style={styles.th}>방 번호</th>
                            <th style={styles.th}>제목</th>
                            <th style={styles.th}>개설자</th>
                            <th style={styles.th}>인원</th>
                            <th style={styles.th}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {/* <tbody> 바로 다음에 map 함수가 오도록 하여, 결과물인 <tr>만 자식으로 갖게 합니다. */}
                        {myRooms.map((room) => (
                            <tr key={room.id}>
                                <td style={styles.td}>{room.id}</td>
                                <td style={styles.td}>{room.title}</td>
                                <td style={styles.td}>{room.creator}</td>
                                <td style={styles.td}>{room.participantCount}</td>
                                <td style={styles.td}><button onClick={() => handleEnterRoom(room.id.toString())} style={styles.enterButton}>입장</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={styles.emptyMessage}>참여한 채팅방이 없습니다.</p>
                )}
            </section>

            {/* --- '참여 가능한 채팅방' 섹션도 동일한 구조로 수정 --- */}
            <section style={styles.section}>
                <h2>참여 가능한 채팅방</h2>
                {otherRooms.length > 0 ? (
                    <table style={styles.roomTable}>
                        <thead>
                        <tr>
                            <th style={styles.th}>방 번호</th>
                            <th style={styles.th}>제목</th>
                            <th style={styles.th}>개설자</th>
                            <th style={styles.th}>인원</th>
                            <th style={styles.th}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {otherRooms.map((room) => (
                            <tr key={room.id}>
                                <td style={styles.td}>{room.id}</td>
                                <td style={styles.td}>{room.title}</td>
                                <td style={styles.td}>{room.creator}</td>
                                <td style={styles.td}>{room.participantCount}</td>
                                <td style={styles.td}><button onClick={() => handleEnterRoom(room.id.toString())} style={styles.enterButton}>입장</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={styles.emptyMessage}>참여 가능한 다른 채팅방이 없습니다.</p>
                )}
            </section>
        </div>
    );
};

// --- 스타일 객체 ---
const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
    section: { marginBottom: '30px' },
    form: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' },
    button: { padding: '10px 15px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' },
    roomTable: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#f8f8f8' },
    td: { borderBottom: '1px solid #ddd', padding: '12px', verticalAlign: 'middle' },
    enterButton: { padding: '8px 12px', border: 'none', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', cursor: 'pointer' },
    emptyMessage: { color: '#888' }
};

export default CommunityPage;