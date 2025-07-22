import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import ChatRoom from './ChatRoom';

// 타입 정의 (변경 없음)
interface Room {
    id: string;
    title: string;
}

const CommunityPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [userName, setUserName] = useState('');
    // ★ 사용자가 참여한(입장했던) 방 ID 목록을 관리하는 상태 추가
    const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchRooms();
        const user = prompt("사용자 이름을 입력하세요:");
        if (user) setUserName(user);
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await axios.get<Room[]>('http://localhost:8080/api/chat/rooms');
            if (Array.isArray(response.data)) {
                setRooms(response.data);
            } else {
                console.error("API 응답이 배열이 아닙니다:", response.data);
                setRooms([]);
            }
        } catch (error) {
            console.error("채팅방 목록을 불러오는 데 실패했습니다.", error);
            setRooms([]);
        }
    };

    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim() || !userName) {
            alert('채팅방 이름과 사용자 이름을 모두 입력해주세요.');
            return;
        }
        try {
            const response = await axios.post<Room>(
                'http://localhost:8080/api/chat/rooms',
                { title: newRoomName, username: userName }
            );
            setNewRoomName('');
            fetchRooms();
            alert(`'${response.data.title}' 방이 생성되었습니다. 입장해주세요.`);
        } catch (error) {
            console.error("채팅방 생성에 실패했습니다.", error);
        }
    };

    const handleEnterRoom = (roomId: string) => {
        if (!userName) {
            alert("사용자 이름이 설정되지 않았습니다. 페이지를 새로고침 해주세요.");
            return;
        }
        setSelectedRoomId(roomId);
        // ★ 입장 시, 참여한 방 목록에 추가
        setJoinedRoomIds(prev => new Set(prev).add(roomId));
    };

    const handleLeaveRoom = () => {
        setSelectedRoomId(null);
    };

    // ★ 참여한 방과 참여하지 않은 방을 분리
    const myRooms = rooms.filter(room => joinedRoomIds.has(room.id));
    const otherRooms = rooms.filter(room => !joinedRoomIds.has(room.id));

    if (selectedRoomId) {
        return <ChatRoom roomId={selectedRoomId} userName={userName} onLeave={handleLeaveRoom} />;
    }

    // --- UI 개선 ---
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>아리랑 트레일 커뮤니티</h1>
                <p><strong>{userName || "게스트"}</strong>님, 환영합니다.</p>
            </header>

            <section style={styles.section}>
                <h2>새로운 채팅방 만들기</h2>
                <form onSubmit={handleCreateRoom} style={styles.form}>
                    <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="새 채팅방 이름"
                        style={styles.input}
                    />
                    <button type="submit" style={styles.button}>만들기</button>
                </form>
            </section>

            <section style={styles.section}>
                <h2>내 채팅방</h2>
                {myRooms.length > 0 ? (
                    <ul style={styles.roomList}>
                        {myRooms.map((room) => (
                            <li key={room.id} style={styles.roomItem}>
                                <span>{room.title}</span>
                                <button onClick={() => handleEnterRoom(room.id)} style={styles.enterButton}>재입장</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={styles.emptyMessage}>아직 참여한 채팅방이 없습니다.</p>
                )}
            </section>

            <section style={styles.section}>
                <h2>참여 가능한 채팅방</h2>
                {otherRooms.length > 0 ? (
                    <ul style={styles.roomList}>
                        {otherRooms.map((room) => (
                            <li key={room.id} style={styles.roomItem}>
                                <span>{room.title}</span>
                                <button onClick={() => handleEnterRoom(room.id)} style={styles.enterButton}>입장</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={styles.emptyMessage}>참여 가능한 다른 채팅방이 없습니다.</p>
                )}
            </section>
        </div>
    );
};

// --- 스타일 객체 ---
const styles = {
    container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
    section: { marginBottom: '30px' },
    form: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' },
    button: { padding: '10px 15px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' },
    roomList: { listStyle: 'none', padding: 0 },
    roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' },
    enterButton: { padding: '8px 12px', border: 'none', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', cursor: 'pointer' },
    emptyMessage: { color: '#888' }
};

export default CommunityPage;

// 지금 방에서 구현하고 있는 기능들과 상관관계-박시현
// 1. 상태변수: 메세지 내용 불러오기, 보낼 내용 설정, 웹소켓에 연결된 객체 유지 및 기능
// 2. 함수: 초기-> 1) 유저 이름 프롬프트 및 세팅하기 2) 몽고db에서 채팅방 목록 가져오기, 3) 채팅방 이름 생성(저장)하여 다시 불러오는 api,
// 4) 채팅방 입장하는 함수: 룸아이디를 세팅하는 함수 5)채팅방에서 나가는 함수(룸아이디=null)
// 3. 화면 구성: 선택된 방이 있으면 챗룸을 렌더링하고, 아니면 밑에 채팅방 생성폼과 채팅방 목록을 렌더링 한다.

// 필요: 현재 내가 소속되어 있는 채팅방을 알고, 리턴부에 표현할 수 있어야 한다. 전제조건-> 내가 완전히 나가는 것과 그냥 접속 끊긴것의 구분이 있어야 할려면,
// 챗룸에서 나가기 버튼 눌를때,
