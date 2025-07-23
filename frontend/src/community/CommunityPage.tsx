import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import ChatRoom from './ChatRoom';

// 백엔드의 ChatRoom Document와 필드를 일치시킴
interface Room {
    id: number;
    title: string;
    creator: string;
}

const CommunityPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [userName, setUserName] = useState('');
    // ★ 사용자가 '현재 세션에서만' 참여한 방 ID 목록
    const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchRooms();
        const user = prompt("사용자 이름을 입력하세요:");
        if (user) setUserName(user);
    }, []); // 최초 1회만 실행

    const fetchRooms = async () => {
        console.log("방 목록을 새로고침합니다..."); // ★ 디버깅용 로그
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

            // 4. 새로 생성된 방의 ID를 '참여한 방' 목록에 추가합니다.
            const newRoomId = response.data.id.toString();
            setJoinedRoomIds(prev => new Set(prev).add(newRoomId));

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
        setJoinedRoomIds(prev => new Set(prev).add(roomId));
    };

    const handleLeaveRoom = () => {
        setSelectedRoomId(null);
        fetchRooms();
    };

    const myRooms = rooms.filter(room => joinedRoomIds.has(room.id.toString()));
    const otherRooms = rooms.filter(room => !joinedRoomIds.has(room.id.toString()));

    if (selectedRoomId) {
        return <ChatRoom roomId={selectedRoomId} userName={userName} onLeave={handleLeaveRoom} />;
    }

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
                    <table style={styles.roomTable}>
                        <thead>
                        <tr>
                            <th style={styles.th}>방 번호</th>
                            <th style={styles.th}>제목</th>
                            <th style={styles.th}>개설자</th>
                            <th style={styles.th}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {myRooms.map((room) => (
                            <tr key={room.id}>
                                <td style={styles.td}>{room.id}</td>
                                <td style={styles.td}>{room.title}</td>
                                <td style={styles.td}>{room.creator}</td>
                                <td style={styles.td}><button onClick={() => handleEnterRoom(room.id.toString())} style={styles.enterButton}>입장</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={styles.emptyMessage}>아직 참여한 채팅방이 없습니다. (새로고침 시 초기화됩니다)</p>
                )}
            </section>

            <section style={styles.section}>
                <h2>참여 가능한 채팅방</h2>
                {otherRooms.length > 0 ? (
                    <table style={styles.roomTable}>
                        <thead>
                        <tr>
                            <th style={styles.th}>방 번호</th>
                            <th style={styles.th}>제목</th>
                            <th style={styles.th}>개설자</th>
                            <th style={styles.th}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {otherRooms.map((room) => (
                            <tr key={room.id}>
                                <td style={styles.td}>{room.id}</td>
                                <td style={styles.td}>{room.title}</td>
                                <td style={styles.td}>{room.creator}</td>
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

// 지금 방에서 구현하고 있는 기능들과 상관관계-박시현
// 1. 상태변수: 메세지 내용 불러오기, 보낼 내용 설정, 웹소켓에 연결된 객체 유지 및 기능
// 2. 함수: 초기-> 1) 유저 이름 프롬프트 및 세팅하기 2) 몽고db에서 채팅방 목록 가져오기, 3) 채팅방 이름 생성(저장)하여 다시 불러오는 api,
// 4) 채팅방 입장하는 함수: 룸아이디를 세팅하는 함수 5)채팅방에서 나가는 함수(룸아이디=null)
// 3. 화면 구성: 선택된 방이 있으면 챗룸을 렌더링하고, 아니면 밑에 채팅방 생성폼과 채팅방 목록을 렌더링 한다.

// 필요: 현재 내가 소속되어 있는 채팅방을 알고, 리턴부에 표현할 수 있어야 한다. 전제조건-> 내가 완전히 나가는 것과 그냥 접속 끊긴것의 구분이 있어야 할려면,
// 챗룸에서 나가기 버튼 눌를때,
