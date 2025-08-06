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
type SortType = 'title' | 'subject';

const AllRooms = () => {
    const { handleEnterRoom } = useOutletContext<OutletContext>();
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const lobbyLastUpdated = useSelector((state: RootState) => state.token.lobbyLastUpdated);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [sortType, setSortType] = useState<SortType>('title');
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
            let valueA = '';
            let valueB = '';

            if (sortType === 'title') {
                valueA = a.title || '';
                valueB = b.title || '';
            } else {
                valueA = a.subject || '';
                valueB = b.subject || '';
            }

            if (sortOrder === 'asc') {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        });

        setFilteredRooms(otherRooms);
    }, [rooms, myRoomIds, searchKeyword, sortOrder, sortType]);

    const toggleSort = (type: SortType) => {
        if (sortType === type) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortType(type);
            setSortOrder('asc');
        }
    };

    return (
        <div style={styles.container}>
            {/* 상단 검색 및 정렬 부분 */}
            <div style={styles.controlsContainer}>
                <div style={styles.searchContainer}>
                    <IoSearch style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="방 이름, 축제 이름으로 검색..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <button
                    onClick={() => toggleSort('title')}
                    style={styles.sortButton}
                >
                    제목순
                    {sortType === 'title' && (
                        sortOrder === 'asc' ? <IoArrowUpOutline style={styles.sortIcon} /> : <IoArrowDownOutline style={styles.sortIcon} />
                    )}
                </button>
                <button
                    onClick={() => toggleSort('subject')}
                    style={styles.sortButton}
                >
                    축제이름순
                    {sortType === 'subject' && (
                        sortOrder === 'asc' ? <IoArrowUpOutline style={styles.sortIcon} /> : <IoArrowDownOutline style={styles.sortIcon} />
                    )}
                </button>
            </div>

            {/* 👇 여기서부터가 실제 목록을 표시하는 부분입니다. */}
            <div style={styles.roomListContainer}>
                {filteredRooms.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        {searchKeyword ? '검색 결과가 없습니다.' : '참여 가능한 채팅방이 없습니다.'}
                    </div>
                ) : (
                    // ✅ map 함수 내부를 새로운 가로 카드 구조로 변경
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
                                    <span>참여인원: {`${room.participantCount || 0} / ${room.maxParticipants || '-'}`}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <IoCalendarOutline style={styles.infoIcon} />
                                    <span>모임날짜: {room.meetingDate ? new Date(room.meetingDate).toLocaleDateString() : '날짜 미정'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { width: '100%' },
    controlsContainer: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', padding: '15px 0' },
    searchContainer: { position: 'relative', flex: 1 },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '16px' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box' },
    sortButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 16px', border: '2px solid #e9ecef', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#495057', transition: 'all 0.2s ease', whiteSpace: 'nowrap', minWidth: '120px' },
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
};

export default AllRooms;