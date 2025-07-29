import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Room } from './CommunityPage';
import apiClient from "../api/axiosInstance";
import { IoSearch, IoArrowUpOutline, IoArrowDownOutline } from 'react-icons/io5';

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
    const [myRoomIds, setMyRoomIds] = useState<number[]>([]);

    // 채팅방 목록 불러오기
    const fetchRooms = async () => {
        try {
            const response = await apiClient.get<Room[]>(`chat/rooms`);
            const roomData = Array.isArray(response.data) ? response.data : [];
            setRooms(roomData);
            setFilteredRooms(roomData);
        } catch (error) {
            console.error("채팅방 목록을 불러오는 데 실패했습니다.", error);
        }
    };

    // 내 채팅방 목록 불러오기
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

    // 웹소켓 신호에 따른 새로고침
    useEffect(() => {
        if (lobbyLastUpdated) {
            console.log('웹소켓 신호를 감지하여 채팅방 목록을 새로고침합니다.');
            fetchRooms();
            fetchMyRooms();
        }
    }, [lobbyLastUpdated]);

    // 초기 데이터 로딩
    useEffect(() => {
        if (userName) {
            fetchRooms();
            fetchMyRooms();
        }
    }, [userName]);

    // 정렬 토글
    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };
    useEffect(() => {
        // 내가 참여하지 않은 채팅방만 필터링
        let otherRooms = rooms.filter(room => !myRoomIds.includes(room.id));

        // 검색 필터링
        if (searchKeyword.trim()) {
            otherRooms = otherRooms.filter(room =>
                room.title.toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }

        // 정렬
        otherRooms = [...otherRooms].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.title.localeCompare(b.title);
            } else {
                return b.title.localeCompare(a.title);
            }
        });

        setFilteredRooms(otherRooms);
    }, [rooms, myRoomIds, searchKeyword, sortOrder]);

    return (
        <div style={styles.container}>
            {/* 검색 및 정렬 컨트롤 */}
            <div style={styles.controlsContainer}>
                <div style={styles.searchContainer}>
                    <IoSearch style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="채팅방 제목을 검색해보세요..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <button onClick={toggleSort} style={styles.sortButton}>
                    제목순
                    {sortOrder === 'asc' ?
                        <IoArrowUpOutline style={styles.sortIcon} /> :
                        <IoArrowDownOutline style={styles.sortIcon} />
                    }
                </button>
            </div>

            {/* 채팅방 목록 */}
            <div style={styles.roomListContainer}>
                {filteredRooms.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        {searchKeyword ?
                            '검색 결과가 없습니다.' :
                            '참여 가능한 채팅방이 없습니다.'
                        }
                    </div>
                ) : (
                    <div style={styles.roomGrid}>
                        {filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                onClick={() => handleEnterRoom(room.id.toString())}
                                style={styles.roomCard}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                            >
                                <div style={styles.roomCardHeader}>
                                    <h3 style={styles.roomTitle}>{room.title}</h3>
                                    <span style={styles.roomId}>#{room.id}</span>
                                </div>
                                <div style={styles.roomCardBody}>
                                    <div style={styles.roomInfo}>
                                        <span style={styles.creator}>
                                            개설자: <strong>{room.creator}</strong>
                                        </span>
                                        <span style={styles.participantCount}>
                                            참여자: <strong>{room.participantCount}명</strong>
                                        </span>
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

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100%'
    },
    controlsContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '25px',
        padding: '15px 0'
    },
    searchContainer: {
        position: 'relative',
        flex: 1
    },
    searchIcon: {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#6c757d',
        fontSize: '16px'
    },
    searchInput: {
        width: '100%',
        padding: '12px 12px 12px 40px',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        boxSizing: 'border-box'
    },
    sortButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 18px',
        border: '2px solid #e9ecef',
        backgroundColor: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#495057',
        transition: 'all 0.2s ease'
    },
    sortIcon: {
        fontSize: '16px'
    },
    roomListContainer: {
        minHeight: '300px'
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '16px',
        padding: '60px 20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
    },
    roomGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
    },
    roomCard: {
        backgroundColor: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    roomCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
    },
    roomTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#212529',
        lineHeight: 1.3,
        flex: 1,
        marginRight: '10px'
    },
    roomId: {
        fontSize: '12px',
        color: '#6c757d',
        backgroundColor: '#f8f9fa',
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: '500'
    },
    roomCardBody: {
        flex: 1
    },
    roomInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    creator: {
        fontSize: '14px',
        color: '#495057'
    },
    participantCount: {
        fontSize: '14px',
        color: '#007bff'
    },
    roomCardFooter: {
        marginTop: '15px',
        paddingTop: '12px',
        borderTop: '1px solid #f1f3f4'
    },
    clickHint: {
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center',
        display: 'block'
    }
};

export default AllRooms;