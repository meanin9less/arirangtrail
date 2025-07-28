import React, { useState, useEffect, FormEvent } from 'react';
import ChatRoom from './ChatRoom';
import {useDispatch, useSelector} from 'react-redux';
import store, { RootState } from '../store';
import {BsChatDots} from "react-icons/bs";
import { Link } from 'react-router-dom';
import apiClient from "../api/axiosInstance";


// 백엔드의 DTO와 일치하는 인터페이스 (participantCount 포함 확인)
interface Room {
id: number;
title: string;
creator: string;
participantCount: number;
// isLiked: boolean; // 내가 좋아요를 눌렀는지 여부
// shareCount: number; // 공유 횟수
}

const CommunityPage = () => {
const userProfile = useSelector((state: RootState) => state.token.userProfile);
const userName = userProfile?.username;
const dispatch= useDispatch();
const [rooms, setRooms] = useState<Room[]>([]);
const [newRoomName, setNewRoomName] = useState('');
const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
const [myRoomIds, setMyRoomIds] = useState<number[]>([]);
const lobbyLastUpdated = useSelector((state: RootState) => state.token.lobbyLastUpdated);

const fetchRooms = async () => {
    try {
        const response = await apiClient.get<Room[]>(`chat/rooms`);
        setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
        console.error("채팅방 목록을 불러오는 데 실패했습니다.", error);
    }
};

const fetchMyRooms = async () => {
    if (!userName) return;
    try {
        const response = await apiClient.get<number[]>(`chat/rooms/my-rooms`, {
            params: { username: userName }
        });
        setMyRoomIds(response.data);
    } catch (error) {
        console.error("내 채팅방 목록을 가져오는 데 실패했습니다.", error);
    }
};

// ↓↓↓ 웹소켓 신호에 따른 새로고침을 위한 새로운 useEffect를 추가합니다. ↓↓↓
useEffect(() => {
    // lobbyLastUpdated가 null이 아닐 때만 (즉, 업데이트 신호가 한 번이라도 왔을 때만) 실행
    if (lobbyLastUpdated) {
        console.log('웹소켓 신호를 감지하여 채팅방 목록을 새로고침합니다.');
        fetchRooms();
        fetchMyRooms();
    }
}, [lobbyLastUpdated]); // lobbyLastUpdated 값이 바뀔 때마다 이 훅이 실행됩니다.



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
        const response= await apiClient.post<Room>(`chat/rooms`, { title: newRoomName, username: userName });
        setNewRoomName('');
        console.log("방 생성 성공! 채팅방 목록을 새로고침합니다.");
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

// const handlelike=async (roomId: number)=>{
//     try {
//         // const username=userName;
//         const response = await apiClient.post<boolean>(`/festivals/${roomId}/like`);
//         //?username=${username}
//         console.log("현재 like 상태:"+ response.data);
//     } catch (e) {
//         console.error("좋아요 실패했습니다.", e);
//     }
// }
//
// const handleShared=async (roomId:number)=>{
//     try {
//         const response=await apiClient.post(`/festivals/${roomId}/share`);
//
//         console.log("현재 Shared 상태:"+ response.data);
//     } catch (error) {
//         console.error("공유 처리 실패:", error);
//     }
// }

const myRooms = rooms.filter(room => myRoomIds.includes(room.id));
const otherRooms = rooms.filter(room => !myRoomIds.includes(room.id));

if (selectedRoomId) {
    return <ChatRoom roomId={selectedRoomId} onLeave={handleLeaveRoom} />;
}
// ===== 비로그인 상태의 UI 개선 =====
if (!userName) {
    return (
        <div style={loginStyles.container}>
            {/* 메인 카드 */}
            <div style={loginStyles.card}>
                {/* 상단 섹션: 이미지 - 아이콘 - 이미지 */}
                <div style={loginStyles.topSection}>
                    <img
                        src={"/dochat-e1.png"}
                        alt={"채팅 장식 이미지1"}
                        style={loginStyles.inlineImage}
                    />
                    <BsChatDots style={loginStyles.icon} />
                    <img
                        src={"/dochat-e2.png"}
                        alt={"채팅 장식 이미지2"}
                        style={loginStyles.inlineImage}
                    />
                </div>

                {/* 하단 텍스트 및 버튼 섹션 */}
                <h2 style={loginStyles.title}>커뮤니티에 참여해보세요!</h2>
                <p style={loginStyles.description}>
                    로그인하고 다른 여행자들과 축제에 대한 이야기를 나누거나, <br/>
                    새로운 채팅방을 만들어 대화를 시작할 수 있습니다.
                </p>
                <Link to="/login" style={loginStyles.loginButton}>
                    로그인 하러 가기
                </Link>
            </div>
        </div>
    );
}

// 이 부분은 CommunityPage.tsx의 return 문 전체입니다.
return (
    <div style={styles.container}>
        <header style={styles.header}>
            <img
                src={"/dochat-e2.png"}
                alt="커뮤니티 아이콘"
                style={styles.headerImage}
            />
            <div>
                <h1 style={styles.headerTitle}>아리랑 트레일 커뮤니티</h1>
                <p style={styles.welcomeMessage}><strong>{userName}</strong>님, 환영합니다.</p>
            </div>
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

// --- 비로그인 상태 스타일 ---
const loginStyles: { [key: string]: React.CSSProperties } = {
container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 200px)',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
},
card: {
    display: 'flex',
    flexDirection: 'column', // 내부 요소들을 세로로 정렬
    alignItems: 'center',    // 내부 요소들을 가로축 중앙에 배치
    padding: '40px',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '600px', // 이미지 포함을 위해 너비 약간 확장
},
// ★ 새로 추가: 상단 이미지와 아이콘을 담는 컨테이너
topSection: {
    display: 'flex',
    alignItems: 'center',     // 세로축 중앙 정렬
    justifyContent: 'center', // 가로축 중앙 정렬
    marginBottom: '15px',     // 제목과의 간격
},
// ★ 새로 추가: 카드 내부에 들어갈 이미지 스타일
inlineImage: {
    height: '140px', // 원하는 크기로 조절
    width: 'auto',
},
icon: {
    fontSize: '70px',
    color: '#007bff',
    margin: '0 20px', // 좌우 이미지와의 간격
},
title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
},
description: {
    fontSize: '16px',
    color: '#6c757d',
    marginBottom: '30px',
    lineHeight: 1.6,
},
loginButton: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
}
};

// --- 스타일 객체 ---
const styles: { [key: string]: React.CSSProperties } = {
container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
// ▼▼▼▼▼▼▼▼▼▼ 스타일 수정 및 추가 ▼▼▼▼▼▼▼▼▼▼
header: {
    display: 'flex',          // 가로 정렬을 위해 추가
    alignItems: 'center',     // 세로 중앙 정렬을 위해 추가
    borderBottom: '2px solid #eee',
    paddingBottom: '15px',
    marginBottom: '30px'
},
headerImage: {
    height: '100px',           // 이미지 높이 지정
    width: 'auto',            // 너비는 비율에 맞게 자동 조절
    marginRight: '5px',      // 이미지와 텍스트 사이 간격
},
headerTitle: {
    margin: 0,                // h1 태그의 기본 마진 제거
    fontSize: '2rem',         // 제목 폰트 크기
},
welcomeMessage: {
    margin: '5px 0 0 0',      // 제목과의 간격 조절
    color: '#333'
},
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲,
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