import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import ChatRoom from './ChatRoom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// 백엔드의 ChatRoom Document와 필드를 일치시킴
interface Room {
    id: number;
    title: string;
    creator: string;
    participantCount: number; // ✨ 추가
}

const CommunityPage = () => {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username; // 옵셔널 체이닝으로 안전하게 접근

    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // ✨ 3. '내 채팅방' ID 목록을 관리할 상태를 추가합니다. (DB에서 가져온 데이터를 담을 곳)
    const [myRoomIds, setMyRoomIds] = useState<number[]>([]);

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchRooms = async () => {
        console.log("방 목록을 새로고침합니다..."); // ★ 디버깅용 로그
        try {
            const response = await axios.get<Room[]>(`${API_URL}/api/chat/rooms`);
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

    // ✨ 4. '내가 참여한 방' 목록을 가져오는 API 호출 함수를 만듭니다.
    const fetchMyRooms = async () => {
        if (!userName) return; // userName이 없으면 함수를 실행하지 않습니다.
        try {
            const response = await axios.get<number[]>(`${API_URL}/api/chat/rooms/my-rooms`, {
                params: { username: userName } // 쿼리 파라미터로 username 전달
            });
            setMyRoomIds(response.data);
        } catch (error) {
            console.error("내 채팅방 목록을 가져오는 데 실패했습니다.", error);
        }
    };

    // ✨ 5. useEffect 로직을 개선합니다.
    useEffect(() => {
        // userName이 Redux 스토어로부터 성공적으로 로드되었을 때만 API를 호출합니다.
        if (userName) {
            fetchRooms();   // 전체 방 목록 가져오기
            fetchMyRooms(); // 내 방 목록 가져오기
        }
    }, [userName]);

    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim() || !userName) {
            alert('채팅방 이름과 사용자 이름을 모두 입력해주세요.');
            return;
        }
        try {
            const response = await axios.post<Room>(
                `${API_URL}/api/chat/rooms`,
                { title: newRoomName, username: userName }
            );
            setNewRoomName('');
            await fetchRooms();   // ✨ 전체 방 목록 새로고침
            await fetchMyRooms(); // ✨ 내 방 목록도 새로고침
            alert(`'${response.data.title}' 방이 생성되었습니다. 입장해주세요.`);
        } catch (error) {
            console.error("채팅방 생성에 실패했습니다.", error);
        }
    };

    const handleEnterRoom = (roomId: string) => {
        if (!userName) {
            alert("사용자 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }
        setSelectedRoomId(roomId);
        // ✨ 방에 입장할 때 fetchMyRooms를 호출하여 '내 채팅방' 목록을 갱신합니다.
        fetchMyRooms();
    };

    const handleLeaveRoom = () => {
        setSelectedRoomId(null);
        // ✨ 채팅방에서 로비로 돌아올 때, 방 목록 상태를 최신으로 유지합니다.
        fetchRooms();
        fetchMyRooms();
    };

    const myRooms = rooms.filter(room => myRoomIds.includes(room.id));
    const otherRooms = rooms.filter(room => !myRoomIds.includes(room.id));

    //프롭스 확인
    if (selectedRoomId) {
        return <ChatRoom roomId={selectedRoomId} onLeave={handleLeaveRoom} />;
    }

    // 로그인되지 않은 상태를 위한 UI
    if (!userName) {
        return <div>로그인 후 이용 가능합니다.</div>;
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>아리랑 트레일 커뮤니티</h1>
                <p><strong>{userName}</strong>님, 환영합니다.</p>
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
                            <th style={styles.th}>인원</th> {/* ✨ 인원 헤더 추가 */}
                            <th style={styles.th}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {myRooms.map((room) => (
                            <tr key={room.id}>
                                <td style={styles.td}>{room.id}</td>
                                <td style={styles.td}>{room.title}</td>
                                <td style={styles.td}>{room.creator}</td>
                                <td style={styles.td}>{room.participantCount}</td> {/* ✨ 인원 표시 */}
                                <td style={styles.td}><button onClick={() => handleEnterRoom(room.id.toString())} style={styles.enterButton}>입장</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={styles.emptyMessage}>참여한 채팅방이 없습니다.</p>
                )}
            </section>

            <section style={styles.section}>
                <h2>참여 가능한 채팅방</h2>
                {otherRooms.length > 0 ? (
                    <table style={styles.roomTable}>
                        {/* a,b,c,d */}
                        <tbody>
                        {otherRooms.map((room) => (
                            <tr key={room.id}>
                                <td style={styles.td}>{room.id}</td>
                                <td style={styles.td}>{room.title}</td>
                                <td style={styles.td}>{room.creator}</td>
                                <td style={styles.td}>{room.participantCount}</td> {/* ✨ 인원 표시 */}
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
