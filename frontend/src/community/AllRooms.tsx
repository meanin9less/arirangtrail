import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Room } from './CommunityPage';
import apiClient from "../api/axiosInstance";
import { IoSearch, IoArrowUpOutline, IoArrowDownOutline, IoPeopleOutline, IoCalendarOutline, IoChatbubblesOutline } from 'react-icons/io5';

interface OutletContext {
    handleEnterRoom: (roomId: string) => void;
}

type SortOrder = 'asc' | 'desc';

const AllRooms = () => {
    const { handleEnterRoom } = useOutletContext<OutletContext>();
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const lobbyLastUpdated = useSelector((state: RootState) => state.token.lobbyLastUpdated);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [myRoomIds, setMyRoomIds] = useState<string[]>([]);

    const fetchAllData = useCallback(async () => {
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
        fetchAllData();
    }, [userName, lobbyLastUpdated, fetchAllData]);

    useEffect(() => {
        // 전체방 목록에서는 필터링을 주석 처리한 요구사항을 반영합니다.
        let otherRooms = rooms; // .filter(room => !myRoomIds.includes(String(room.id)));

        if (searchKeyword.trim()) {
            const lowerCaseKeyword = searchKeyword.toLowerCase();
            otherRooms = otherRooms.filter(room =>
                (room.title || '').toLowerCase().includes(lowerCaseKeyword) ||
                (room.subject || '').toLowerCase().includes(lowerCaseKeyword)
            );
        }

        otherRooms.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            if (sortOrder === 'asc') {
                return titleA.localeCompare(titleB);
            } else {
                return titleB.localeCompare(titleA);
            }
        });

        setFilteredRooms(otherRooms);
    }, [rooms, myRoomIds, searchKeyword, sortOrder]);

    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    return (
        <div style={styles.container}>
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
                {filteredRooms.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        {searchKeyword ? '검색 결과가 없습니다.' : '참여 가능한 채팅방이 없습니다.'}
                    </div>
                ) : (
                    <div style={styles.roomGrid}>
                        {filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                onClick={() => handleEnterRoom(String(room.id))}
                                style={styles.roomCard}
                            >
                                <div style={styles.roomCardHeader}>
                                    <h3 style={styles.roomTitle}>
                                        {room.title || '제목 없음'}
                                        <span style={styles.roomId}>#{room.id}</span>
                                    </h3>
                                    <span style={styles.subjectPill}>{room.subject || '일반'}</span>
                                </div>
                                <div style={styles.roomInfoGrid}>
                                    <div style={styles.infoItem}>
                                        <IoPeopleOutline style={styles.infoIcon} />
                                        <span>인원수: {`${room.participantCount || 0} / ${room.maxParticipants || '-'}`}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <IoCalendarOutline style={styles.infoIcon} />
                                        <span>모임 날짜: {room.meetingDate ? new Date(room.meetingDate).toLocaleDateString() : '날짜 미정'}</span>
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

// ✅ 수정: 중복된 styles 객체를 하나로 합치고 정리했습니다.
const styles: { [key: string]: React.CSSProperties } = {
    container: { width: '100%' },
    controlsContainer: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', padding: '15px 0' },
    searchContainer: { position: 'relative', flex: 1 },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '16px' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box' },
    sortButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 18px', border: '2px solid #e9ecef', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#495057', transition: 'all 0.2s ease' },
    sortIcon: { fontSize: '16px' },
    roomListContainer: { minHeight: '300px' },
    emptyMessage: { textAlign: 'center', color: '#6c757d', fontSize: '16px', padding: '60px 20px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
    roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    roomCard: { backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    roomCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    // ✅ roomTitle 속성을 하나로 합쳤습니다.
    roomTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#212529',
        flex: 1,
        marginRight: '10px',
        wordBreak: 'break-all',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    roomId: {
        fontSize: '12px',
        color: '#6c757d',
        backgroundColor: '#f8f9fa',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: '500'
    },
    subjectPill: { fontSize: '12px', color: '#007bff', backgroundColor: '#e7f3ff', padding: '4px 10px', borderRadius: '12px', fontWeight: '500', whiteSpace: 'nowrap' },
    roomInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f3f4' },
    infoItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#495057' },
    infoIcon: { fontSize: '16px', color: '#007bff' },
    roomCardFooter: { marginTop: '15px', paddingTop: '12px', borderTop: '1px solid #f1f3f4', textAlign: 'center' },
    clickHint: { fontSize: '12px', color: '#6c757d' }
};

export default AllRooms;