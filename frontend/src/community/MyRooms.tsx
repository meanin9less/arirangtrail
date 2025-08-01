// src/community/MyRooms.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Room } from './CommunityPage';
import apiClient from "../api/axiosInstance";
import { IoSearch, IoArrowUpOutline, IoArrowDownOutline, IoPeopleOutline, IoCalendarOutline, IoChatbubblesOutline, IoChatbubbleOutline } from 'react-icons/io5';

interface OutletContext {
    handleEnterRoom: (roomId: string) => void;
}

type SortOrder = 'asc' | 'desc';

const MyRooms = () => {
    const { handleEnterRoom } = useOutletContext<OutletContext>();
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const lobbyLastUpdated = useSelector((state: RootState) => state.token.lobbyLastUpdated);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [myRoomIds, setMyRoomIds] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        if (!userName) return;
        try {
            const [roomsResponse, myRoomsResponse] = await Promise.all([
                apiClient.get<Room[]>(`chat/rooms`, { params: { username: userName } }),
                apiClient.get<string[]>(`chat/rooms/my-rooms`, { params: { username: userName } })
            ]);

            const roomData = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
            setRooms(roomData);
            setMyRoomIds(myRoomsResponse.data.map(String));

        } catch (error) {
            console.error("채팅방 데이터를 불러오는 데 실패했습니다.", error);
        }
    }, [userName]);

    useEffect(() => {
        fetchData();
    }, [userName, lobbyLastUpdated, fetchData]);

    useEffect(() => {
        let myRooms = rooms.filter(room => myRoomIds.includes(String(room.id)));

        if (searchKeyword.trim()) {
            const lowerCaseKeyword = searchKeyword.toLowerCase();
            myRooms = myRooms.filter(room =>
                (room.title || '').toLowerCase().includes(lowerCaseKeyword) ||
                (room.subject || '').toLowerCase().includes(lowerCaseKeyword)
            );
        }

        myRooms.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            return sortOrder === 'asc'
                ? titleA.localeCompare(titleB)
                : titleB.localeCompare(titleA);
        });

        setFilteredRooms(myRooms);
    }, [rooms, myRoomIds, searchKeyword, sortOrder]);

    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    return (
        <div style={styles.container}>
            {/* 상단 검색 및 정렬 부분 (MyRooms에 맞게 수정 가능) */}
            <div style={styles.controlsContainer}>
                <div style={styles.searchContainer}>
                    <IoSearch style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="방 이름, 주제로 검색..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <button onClick={toggleSort} style={styles.sortButton}>
                    제목순
                    {sortOrder === 'asc' ? <IoArrowUpOutline style={styles.sortIcon} /> : <IoArrowDownOutline style={styles.sortIcon} />}
                </button>
            </div>

            <div style={styles.roomListContainer}>
                {/* 👇 myFilteredRooms 배열을 사용합니다. */}
                {filteredRooms.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        {searchKeyword ? '검색 결과가 없습니다.' : '참여 중인 채팅방이 없습니다.'}
                    </div>
                ) : (
                    // ✅ AllRooms와 동일한 가로 카드 구조 사용
                    filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => handleEnterRoom(String(room.id))}
                            style={styles.roomCard}
                        >
                            {/* === 왼쪽 정보 그룹 === */}
                            <div style={styles.cardLeft}>
                                <h3 style={styles.roomTitle}>
                                    {room.title || '제목 없음'}

                                    {room.unreadCount && room.unreadCount > 0 && (
                                        <span style={styles.newBadge}>NEW</span>
                                    )}

                                    <span style={styles.subjectPill}>{room.subject || '일반'}</span>
                                </h3>
                                <div style={styles.creatorInfo}>
                                    <IoChatbubblesOutline style={styles.infoIcon} />
                                    <span>개설자: <strong>{room.creatorNickname || room.creator}</strong></span>
                                </div>
                            </div>

                            {/* === 오른쪽 정보 그룹 === */}
                            <div style={styles.cardRight}>
                                <div style={styles.infoItem}>
                                    <IoPeopleOutline style={styles.infoIcon} />
                                    <span>{`${room.participantCount || 0} / ${room.maxParticipants || '-'}`}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <IoCalendarOutline style={styles.infoIcon} />
                                    <span>{room.meetingDate ? new Date(room.meetingDate).toLocaleDateString() : '날짜 미정'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const pulseKeyframes = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}`;

if (!document.getElementById('pulse-animation-style')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'pulse-animation-style';
    styleSheet.innerText = pulseKeyframes;
    document.head.appendChild(styleSheet);
}

// AllRooms.tsx 파일의 styles 객체를 아래 코드로 교체하세요.

const styles: { [key: string]: React.CSSProperties } = {
    container: { width: '100%' },
    controlsContainer: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', padding: '15px 0' },
    searchContainer: { position: 'relative', flex: 1 },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '16px' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box' },
    sortButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 18px', border: '2px solid #e9ecef', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#495057', transition: 'all 0.2s ease' },
    sortIcon: { fontSize: '16px' },
    emptyMessage: { textAlign: 'center', color: '#6c757d', fontSize: '16px', padding: '60px 20px', backgroundColor: '#f8f9fa', borderRadius: '8px' },

    // ✅ [수정] roomGrid -> roomListContainer 로 변경하고 속성 수정
    roomListContainer: {
        display: 'flex',
        flexDirection: 'column', // 카드를 세로로 쌓음
        gap: '15px',             // 카드 사이의 간격
    },

    // ✅ [수정] roomCard 스타일을 가로형으로 변경
    roomCard: {
        backgroundColor: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '20px 25px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'row', // 내부 요소를 가로로 정렬
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // ✅ [추가] 카드 왼쪽 그룹
    cardLeft: {
        flex: 1,
        marginRight: '20px',
    },

    // ✅ [추가] 카드 오른쪽 그룹
    cardRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '25px',
        flexShrink: 0,
    },

    // ✅ [수정] roomTitle 스타일
    roomTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#212529',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    subjectPill: { fontSize: '12px', color: '#007bff', backgroundColor: '#e7f3ff', padding: '4px 10px', borderRadius: '12px', fontWeight: '500', whiteSpace: 'nowrap' },

    // ✅ [추가] 개설자 정보 스타일
    creatorInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#495057',
    },

    // ✅ [수정] 오른쪽 그룹에서 사용할 정보 아이템 스타일
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#495057',
    },
    infoIcon: { fontSize: '18px', color: '#868e96' },
    newBadge: {
        fontSize: '11px',
        color: 'white',
        backgroundColor: '#dc3545', // 붉은색 배경
        padding: '2px 7px',
        borderRadius: '12px',
        fontWeight: 'bold',
        marginLeft: '8px', // 제목과의 간격
        animation: 'pulse 1.5s infinite', // 애니메이션 효과 적용
    },
};

export default MyRooms;