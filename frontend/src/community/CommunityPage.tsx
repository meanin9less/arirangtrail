import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import ChatRoom from './ChatRoom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { BsChatDots } from "react-icons/bs";
import apiClient from "../api/axiosInstance";
import Modal from "../components/Modal";

// 백엔드의 DTO와 일치하는 인터페이스
export interface Room {
    id: number;
    title: string;
    creator: string;
    participantCount: number;
}

const CommunityPage = () => {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false); // 성공 메시지 모달 상태

    useEffect(() => {
        if (userName && location.pathname === '/community') {
            navigate('/community/all-rooms', { replace: true });
        }
    }, [userName, location.pathname, navigate]);

    useEffect(() => {
        const handleOpenModal = (e: Event) => {
            const customEvent = e as CustomEvent<{ open: boolean }>;
            if (customEvent.detail?.open) setIsModalOpen(true);
        };
        window.addEventListener('openModal', handleOpenModal);
        return () => window.removeEventListener('openModal', handleOpenModal);
    }, []);

    const handleCreateRoom = async (roomName: string) => {
        if (!roomName.trim() || !userName) return;
        try {
            await apiClient.post<Room>(`chat/rooms`, {
                title: roomName,
                username: userName
            });
            setIsModalOpen(false); // 생성 모달 닫기
            navigate('/community/my-rooms'); // 내 채팅방 탭으로 이동
            setSuccessModalOpen(true); // 성공 메시지 모달 열기
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
    };

    if (!userName) {
        return (
            <div style={loginStyles.container}>
                <div style={loginStyles.card}>
                    <div style={loginStyles.topSection}>
                        <img src={"/dochat-e1.png"} alt={"채팅 장식 이미지1"} style={loginStyles.inlineImage} />
                        <BsChatDots style={loginStyles.icon} />
                        <img src={"/dochat-e2.png"} alt={"채팅 장식 이미지2"} style={loginStyles.inlineImage} />
                    </div>
                    <h2 style={loginStyles.title}>커뮤니티에 참여해보세요!</h2>
                    <p style={loginStyles.description}>
                        로그인하고 다른 여행자들과 축제에 대한 이야기를 나누거나, <br />
                        새로운 채팅방을 만들어 대화를 시작할 수 있습니다.
                    </p>
                    <Link to="/login" style={loginStyles.loginButton}>
                        로그인 하러 가기
                    </Link>
                </div>
            </div>
        );
    }

    if (selectedRoomId) {
        return <ChatRoom roomId={selectedRoomId} onLeave={handleLeaveRoom} />;
    }

    const isAllRoomsActive = location.pathname.includes('/all-rooms');
    const isMyRoomsActive = location.pathname.includes('/my-rooms');

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <img src={"/dochat-e2.png"} alt="커뮤니티 아이콘" style={styles.headerImage} />
                <div>
                    <h1 style={styles.headerTitle}>아리랑 트레일 커뮤니티</h1>
                    <p style={styles.welcomeMessage}>
                        <strong>{userName}</strong>님, 환영합니다.
                    </p>
                </div>
            </header>

            <div style={styles.tabContainer}>
                <button
                    onClick={() => navigate('/community/all-rooms')}
                    style={{
                        ...styles.tab,
                        ...(isAllRoomsActive ? styles.activeTab : {})
                    }}
                >
                    전체 채팅방
                </button>
                <button
                    onClick={() => navigate('/community/my-rooms')}
                    style={{
                        ...styles.tab,
                        ...(isMyRoomsActive ? styles.activeTab : {})
                    }}
                >
                    내 채팅방
                </button>
                <span
                    onClick={() => setIsModalOpen(true)}
                    style={styles.createRoomText}
                >
                    + 방 생성하기
                </span>
            </div>

            <div style={styles.tabContent}>
                <Outlet context={{ handleEnterRoom }} />
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateRoom}
                />
                <Modal
                    isOpen={successModalOpen}
                    onClose={() => setSuccessModalOpen(false)}
                    onCreate={() => {}} // 빈 함수, 성공 모달은 onCreate 필요 없음
                    successMessage="방이 생성되었습니다. 내 채팅방에서 확인하세요"
                />
            </div>
        </div>
    );
};

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
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px',
        borderRadius: '12px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '600px',
    },
    topSection: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '15px',
    },
    inlineImage: {
        height: '140px',
        width: 'auto',
    },
    icon: {
        fontSize: '70px',
        color: '#007bff',
        margin: '0 20px',
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

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'sans-serif'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #eee',
        paddingBottom: '15px',
        marginBottom: '30px'
    },
    headerImage: {
        height: '100px',
        width: 'auto',
        marginRight: '15px',
    },
    headerTitle: {
        margin: 0,
        fontSize: '2rem',
    },
    welcomeMessage: {
        margin: '5px 0 0 0',
        color: '#333'
    },
    tabContainer: {
        display: 'flex',
        borderBottom: '2px solid #e9ecef',
        marginBottom: '20px',
        justifyContent: 'space-between',
    },
    tab: {
        padding: '12px 24px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        color: '#6c757d',
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s ease'
    },
    activeTab: {
        color: '#007bff',
        borderBottomColor: '#007bff',
        backgroundColor: '#f8f9fa'
    },
    createRoomText: {
        padding: '12px 24px',
        color: '#6c757d',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'color 0.2s ease',
        marginLeft: 'auto',
    },
    createRoomTextHover: {
        color: '#007bff',
    },
    tabContent: {
        minHeight: '400px'
    }
};

export default CommunityPage;