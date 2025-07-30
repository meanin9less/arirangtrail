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
            <div style={styles.controlsContainer}>
                <div style={styles.searchContainer}>
                    <IoSearch style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="내 채팅방 이름, 주제로 검색..."
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
                {filteredRooms.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <IoChatbubbleOutline style={styles.emptyIcon} />
                        <div style={styles.emptyMessage}>
                            {searchKeyword ? '검색 결과가 없습니다.' : '참여한 채팅방이 없습니다.'}
                        </div>
                        {!searchKeyword && (
                            <p style={styles.emptySubMessage}>
                                새로운 채팅방을 만들거나 전체 채팅방에서 참여해보세요!
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={styles.roomGrid}>
                        {filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                // ✅ 수정: 숫자 타입의 room.id를 String()으로 감싸서 문자열로 변환합니다.
                                onClick={() => handleEnterRoom(String(room.id))}
                                style={styles.roomCard}
                            >
                                <div style={styles.roomCardHeader}>
                                    <div style={styles.titleContainer}>
                                        <h3 style={styles.roomTitle}>
                                            {room.title || '제목 없음'}
                                            <span style={styles.roomId}>#{room.id}</span>
                                        </h3>
                                        {room.creator === userName && (
                                            <span style={styles.ownerBadge}>내가 만든 방</span>
                                        )}
                                    </div>
                                    <div style={styles.subjectContainer}>
                                        {/*{room.unreadCount && room.unreadCount > 0 && (*/}
                                        {/*    <span style={styles.newBadge}>New</span>*/}
                                        {/*)}*/}
                                        {room.unreadCount! > 0 && (
                                            <span style={styles.newBadge}>New</span>
                                        )}
                                        <span style={styles.subjectPill}>{room.subject || '일반'}</span>
                                    </div>
                                </div>
                                <div style={styles.roomInfoGrid}>
                                    <div style={styles.infoItem}>
                                        <IoPeopleOutline style={styles.infoIcon} />
                                        <span>{`${room.participantCount || 0} / ${room.maxParticipants || '-'}`}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <IoCalendarOutline style={styles.infoIcon} />
                                        <span>{room.meetingDate ? new Date(room.meetingDate).toLocaleDateString() : '날짜 미정'}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <IoChatbubblesOutline style={styles.infoIcon} />
                                        <span>개설자: <strong>{room.creator}</strong></span>
                                    </div>
                                </div>
                                <div style={styles.roomCardFooter}>
                                    <span style={styles.clickHint}>클릭하여 입장하기</span>
                                </div>
                            </div>
                        ))}
                    </div>
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

const styles: { [key: string]: React.CSSProperties } = {
    container: { width: '100%' },
    controlsContainer: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', padding: '15px 0' },
    searchContainer: { position: 'relative', flex: 1 },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '16px' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box' },
    sortButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 18px', border: '2px solid #e9ecef', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#495057', transition: 'all 0.2s ease' },
    sortIcon: { fontSize: '16px' },
    roomListContainer: { minHeight: '300px' },
    emptyContainer: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8f9fa', borderRadius: '12px' },
    emptyIcon: { fontSize: '48px', color: '#6c757d', marginBottom: '15px' },
    emptyMessage: { color: '#6c757d', fontSize: '18px', fontWeight: '500', marginBottom: '8px' },
    emptySubMessage: { color: '#868e96', fontSize: '14px', margin: 0 },
    roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    roomCard: { backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    roomCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    titleContainer: { flex: 1, marginRight: '10px' },
    roomTitle: { margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#212529', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '8px' },
    ownerBadge: { fontSize: '11px', color: '#007bff', backgroundColor: '#e3f2fd', padding: '3px 8px', borderRadius: '12px', fontWeight: '500' },
    roomId: { fontSize: '12px', color: '#6c757d', backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' },
    subjectContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
    subjectPill: { fontSize: '12px', color: '#007bff', backgroundColor: '#e7f3ff', padding: '4px 10px', borderRadius: '12px', fontWeight: '500', whiteSpace: 'nowrap' },
    newBadge: { fontSize: '11px', color: 'white', backgroundColor: '#dc3545', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' },
    roomInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f3f4' },
    infoItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#495057' },
    infoIcon: { fontSize: '16px', color: '#007bff' },
    roomCardFooter: { marginTop: '15px', paddingTop: '12px', borderTop: '1px solid #f1f3f4', textAlign: 'center' },
    clickHint: { fontSize: '12px', color: '#6c757d' },
};

export default MyRooms;