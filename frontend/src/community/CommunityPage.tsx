import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import ChatRoom from './ChatRoom'; // 실제 채팅이 이루어질 컴포넌트

// 백엔드에서 받아올 채팅방의 타입 정의
interface Room {
    id: string; // MongoDB ObjectId
    name: string;
}

const CommunityPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [userName, setUserName] = useState(''); // 간단한 사용자 이름 설정

    // 컴포넌트 마운트 시 채팅방 목록 불러오기
    useEffect(() => {
        fetchRooms();
        // 간단히 프롬프트로 사용자 이름 받기 (실제로는 로그인 정보 사용)
        const user = prompt("사용자 이름을 입력하세요:");
        if (user) setUserName(user);
    }, []);

    // 백엔드 API로부터 채팅방 목록을 가져오는 함수
    const fetchRooms = async () => {
        try {
            const response = await axios.get<Room[]>('http://localhost:8080/api/chat/rooms');

            // ★★★ API의 응답 데이터가 정말 배열인지 확인하는 방어 코드 ★★★
            if (Array.isArray(response.data)) {
                setRooms(response.data);
            } else {
                console.error("API 응답이 배열이 아닙니다:", response.data);
                setRooms([]); // 에러가 발생해도 빈 배열로 상태를 유지하여 .map 에러 방지
            }
        } catch (error) {
            console.error("채팅방 목록을 불러오는 데 실패했습니다.", error);
            setRooms([]); // 네트워크 에러가 발생해도 빈 배열로 상태 유지
        }
    };

    // 새로운 채팅방을 생성하는 함수
    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim() || !userName) {
            alert('채팅방 이름과 사용자 이름을 모두 입력해주세요.');
            return;
        }
        try {
            const response = await axios.post<Room>(
                `http://localhost:8080/api/chat/rooms?name=${newRoomName}`
            );
            setNewRoomName('');
            fetchRooms(); // 목록 새로고침
            alert(`'${response.data.name}' 방이 생성되었습니다. 입장해주세요.`);
        } catch (error) {
            console.error("채팅방 생성에 실패했습니다.", error);
        }
    };

    // 특정 채팅방에 입장하는 함수
    const handleEnterRoom = (roomId: string) => {
        if (!userName) {
            alert("사용자 이름이 설정되지 않았습니다. 페이지를 새로고침 해주세요.");
            return;
        }
        setSelectedRoomId(roomId);
    };

    // 채팅방에서 나가는 함수
    const handleLeaveRoom = () => {
        setSelectedRoomId(null);
    }

    // 선택된 방이 없다면 로비 화면을, 있다면 채팅방 컴포넌트를 렌더링
    if (selectedRoomId) {
        return <ChatRoom roomId={selectedRoomId} userName={userName} onLeave={handleLeaveRoom} />;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>아리랑 트레일 커뮤니티</h1>

            {/* 사용자 이름 표시 (간단 구현) */}
            <div>
                <p><strong>내 이름:</strong> {userName || "이름을 설정해주세요."}</p>
            </div>

            {/* 채팅방 생성 폼 */}
            <form onSubmit={handleCreateRoom}>
                <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="새 채팅방 이름"
                />
                <button type="submit">채팅방 만들기</button>
            </form>

            <hr />

            {/* 채팅방 목록 */}
            <h2>채팅방 목록</h2>
            <ul>
                {rooms.length > 0 ? (
                    rooms.map((room) => (
                        <li key={room.id} style={{ margin: '10px 0' }}>
                            <span>{room.name}</span>
                            <button onClick={() => handleEnterRoom(room.id)} style={{ marginLeft: '10px' }}>
                                입장
                            </button>
                        </li>
                    ))
                ) : (
                    <p>개설된 채팅방이 없습니다.</p>
                )}
            </ul>
        </div>
    );
};

export default CommunityPage;