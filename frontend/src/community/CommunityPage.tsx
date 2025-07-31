import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import ChatRoom from './ChatRoom';
import { useSelector, useDispatch } from 'react-redux';
import {RootState, setTotalUnreadCount, updateLobby} from '../store';
import { BsChatDots } from "react-icons/bs";
import apiClient from "../api/axiosInstance";
import Modal from "../components/Modal";

    export interface Room {
    id: string;
    title: string;
    creator: string;
    creatorNickname?: string; // ✅ 추가
    participantCount?: number;
    maxMembers?: number;
    maxParticipants?: number;
    meetingDate?: string;
    subject?: string;
    notice?: string; // 이 필드는 채팅방 들어가서 공지사항 지정할때 쓰임
    unreadCount?: number;
}

const CommunityPage = () => {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const userNickname = userProfile?.nickname;
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<'create' | 'success' | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    const [newRoomInfo, setNewRoomInfo] = useState({
        title: '',
        subject: '',
        maxParticipants: '',
        meetingDate: '',
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (userName && location.pathname === '/community') {
            navigate('/community/all-rooms', { replace: true });
        }
    }, [userName, location.pathname, navigate]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewRoomInfo(prev => ({ ...prev, [name]: value }));
    }, []);

    const validateForm = useCallback(() => {
        const { title, subject, maxParticipants, meetingDate } = newRoomInfo;
        // 여기서는 필수로 가정합니다.
        if (!title.trim() || !subject.trim() || !maxParticipants || !meetingDate) {
            setFormError('모든 필드를 채워주세요.');
            return false;
        }
        const maxMembersNum = parseInt(maxParticipants, 10);
        if (isNaN(maxMembersNum) || maxMembersNum <= 1) {
            setFormError('최대 인원은 2명 이상의 숫자여야 합니다.');
            return false;
        }
        setFormError('');
        return true;
    }, [newRoomInfo]);

    const handleCreateRoom = useCallback(async () => {
        if (!validateForm() || !userName) return;

        try {
            // date string을 ISO 형식으로 전환 (React input은 'yyyy-MM-dd' 형식임)
            const formattedDate = new Date(newRoomInfo.meetingDate).toISOString();

            await apiClient.post<Room>(`chat/rooms`, {
                title: newRoomInfo.title,
                subject: newRoomInfo.subject,
                maxParticipants: parseInt(newRoomInfo.maxParticipants, 10),
                meetingDate: formattedDate, // ISO로 변경
                username: userName,
                nickname: userNickname, // ✅ 생성자 닉네임 추가
            });

            dispatch(updateLobby());
            setActiveModal('success');
            setNewRoomInfo({ // 상태 초기화
                title: '',
                subject: '',
                maxParticipants: '',
                meetingDate: '',
            });
        } catch (error) {
            console.error("채팅방 생성에 실패했습니다.", error);
            setFormError('채팅방 생성에 실패했습니다. 서버 로그를 확인해주세요.');
        }
    }, [validateForm, userName, userNickname, newRoomInfo, dispatch]);

    const handleEnterRoom = async (roomId: string) => {
        if (!userName) return;

        try {
            // ✅ 1. 먼저 입장 가능한지 서버에 확인 요청
            const response = await apiClient.post(`chat/rooms/${roomId}/join`, {
                username: userName
            });

            // ✅ 2. 입장 성공 시에만 ChatRoom 컴포넌트로 이동
            if (response.data.success) {
                console.log("✅ 채팅방 입장 성공:", response.data.message);
                setSelectedRoomId(roomId);
            } else {
                // 서버에서 success: false로 응답한 경우 (혹시나 해서)
                alert(response.data.message || "입장에 실패했습니다.");
            }

        } catch (error: any) {
            // ✅ 3. 입장 실패 시 사용자에게 구체적인 이유 알림
            console.error("❌ 채팅방 입장 실패:", error);

            if (error.response?.data?.message) {
                // 백엔드에서 보낸 구체적인 에러 메시지 표시
                alert(error.response.data.message);
            } else if (error.response?.status === 409) {
                // 정원 초과 (Conflict)
                alert("채팅방 정원이 초과되어 입장할 수 없습니다.");
            } else if (error.response?.status === 403) {
                // 접근 금지 (Forbidden)
                alert("이 채팅방에 접근할 권한이 없습니다.");
            } else if (error.response?.status === 404) {
                // 방 없음 (Not Found)
                alert("존재하지 않는 채팅방입니다.");
            } else {
                // 기타 오류
                alert("채팅방 입장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }

            // ✅ 4. 실패했으므로 ChatRoom으로 이동하지 않음
            // setSelectedRoomId는 호출하지 않아서 로비에 그대로 남아있음
        }
    };


    //표지2
// CommunityPage.tsx의 handleCloseChatRoom 수정
    const handleCloseChatRoom = async (lastReadSeq: number) => {
        if (userName && selectedRoomId) {
            if (lastReadSeq >= 0) {
                try {
                    await apiClient.post(`/chat/rooms/update-status`, {
                        roomId: selectedRoomId,
                        username: userName,
                        lastReadSeq: lastReadSeq
                    });

                    const response = await apiClient.get(`/chat/users/${userName}/unread-count`);
                    dispatch(setTotalUnreadCount(response.data.totalUnreadCount));
                } catch (error) {
                    console.error("읽음 상태 갱신에 실패했습니다.", error);
                }
            }
        }
        setSelectedRoomId(null);
    };

    const openCreateModal = () => {
        setFormError('');
        setNewRoomInfo({ title: '', subject: '', maxParticipants: '', meetingDate: '' });
        setActiveModal('create');
    };

    const handleCloseSuccessModal = () => {
        setActiveModal(null);
        navigate('/community/my-rooms');
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

    if (selectedRoomId) { return <ChatRoom roomId={selectedRoomId} onLeave={handleCloseChatRoom} />; }

    const isAllRoomsActive = location.pathname.includes('/all-rooms');
    const isMyRoomsActive = location.pathname.includes('/my-rooms');

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <img src={"/dochat-e2.png"} alt="커뮤니티 아이콘" style={styles.headerImage} />
                <div>
                    <h1 style={styles.headerTitle}>아리랑 트레일 커뮤니티</h1>
                    <p style={styles.welcomeMessage}>
                        <strong>{userNickname || userName}</strong>님, 환영합니다.
                    </p>
                </div>
            </header>

            <div style={styles.tabContainer}>
                <div>
                    <button onClick={() => navigate('/community/all-rooms')} style={{ ...styles.tab, ...(isAllRoomsActive ? styles.activeTab : {}) }}>
                        전체 채팅방
                    </button>
                    <button onClick={() => navigate('/community/my-rooms')} style={{ ...styles.tab, ...(isMyRoomsActive ? styles.activeTab : {}) }}>
                        내 채팅방
                    </button>
                </div>
                <span onClick={openCreateModal} style={{ ...styles.createRoomText, ...(isHovering ? styles.createRoomTextHover : {}) }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
                    + 방 생성하기
                </span>
            </div>

            <div style={styles.tabContent}>
                <Outlet context={{ handleEnterRoom }} />

                <Modal isOpen={activeModal === 'create'} onClose={() => setActiveModal(null)} title="새로운 채팅방 만들기">
                    <div style={modalStyles.form}>
                        <input type="text" name="title" placeholder="방 이름" value={newRoomInfo.title} onChange={handleInputChange} style={modalStyles.input}/>
                        <input type="text" name="subject" placeholder="주제 (예: 축제 맛집 탐방)" value={newRoomInfo.subject} onChange={handleInputChange} style={modalStyles.input}/>
                        <input type="number" name="maxParticipants" placeholder="최대 인원 (숫자만 입력, 최소 2명 최대 20명)" max={20} min={2} value={newRoomInfo.maxParticipants} onChange={handleInputChange} style={modalStyles.input}/>
                        <input type="date" name="meetingDate" value={newRoomInfo.meetingDate} onChange={handleInputChange} style={modalStyles.input}/>
                        {formError && <p style={modalStyles.error}>{formError}</p>}
                        <button onClick={handleCreateRoom} style={modalStyles.button}>방 만들기</button>
                    </div>
                </Modal>

                <Modal isOpen={activeModal === 'success'} onClose={handleCloseSuccessModal} title="성공">
                    <p>방이 성공적으로 생성되었습니다. 내 채팅방에서 확인해 주세요.</p>
                    <button
                        onClick={handleCloseSuccessModal}
                        style={{
                            ...modalStyles.button,
                            display: 'block',
                            margin: '15px auto 0'
                        }}
                    >
                        확인
                    </button>
                </Modal>
            </div>
        </div>
    );
};

const modalStyles: { [key: string]: React.CSSProperties } = {
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    textarea: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px' },
    button: { padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' },
    error: { color: 'red', fontSize: '14px', textAlign: 'center', margin: 0 }
};

const loginStyles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)', textAlign: 'center', backgroundColor: '#f8f9fa' },
    card: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '600px' },
    topSection: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' },
    inlineImage: { height: '140px', width: 'auto' },
    icon: { fontSize: '70px', color: '#007bff', margin: '0 20px' },
    title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' },
    description: { fontSize: '16px', color: '#6c757d', marginBottom: '30px', lineHeight: 1.6 },
    loginButton: { display: 'inline-block', padding: '12px 30px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', transition: 'background-color 0.2s' }
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { display: 'flex', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '30px' },
    headerImage: { height: '100px', width: 'auto', marginRight: '15px' },
    headerTitle: { margin: 0, fontSize: '2rem' },
    welcomeMessage: { margin: '5px 0 0 0', color: '#333' },
    tabContainer: { display: 'flex', borderBottom: '2px solid #e9ecef', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' },
    tab: {
        padding: '12px 24px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        color: '#6c757d',
        borderBottomWidth: '3px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'transparent',
        transition: 'all 0.2s ease'
    },
    activeTab: {
        color: '#007bff',
        borderBottomColor: '#007bff',
    },
    createRoomText: { padding: '12px 24px', color: '#6c757d', cursor: 'pointer', fontSize: '16px', fontWeight: '500', transition: 'color 0.2s ease' },
    createRoomTextHover: { color: '#007bff' },
    tabContent: { minHeight: '400px' }
};

export default CommunityPage;