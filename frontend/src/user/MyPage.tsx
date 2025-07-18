import React, { useState } from 'react';
import styles from './MyPage.module.css'; // 마이페이지 스타일 임포트
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // Redux RootState 임포트
import { useNavigate } from 'react-router-dom'; // ✨ useNavigate 훅 임포트

const MyPage: React.FC = () => {
    const navigate = useNavigate(); // ✨ useNavigate 훅 초기화

    // Redux store에서 JWT 토큰 가져오기 (로그인 여부 확인용)
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;

    // 사용자 정보는 백엔드에서 가져와야 하지만, 여기서는 임시로 표시
    const dummyUserName = "준홍님"; // 실제로는 서버에서 사용자 이름을 가져와야 합니다.
    const dummyUserEmail = "junhong@example.com"; // 실제로는 서버에서 사용자 이메일을 가져와야 합니다.

    // ✨ 새로운 상태: 비밀번호 인증 섹션 표시 여부
    const [showPasswordAuth, setShowPasswordAuth] = useState(false);
    // ✨ 새로운 상태: 비밀번호 입력 값
    const [currentPassword, setCurrentPassword] = useState('');
    // ✨ 새로운 상태: 인증 메시지 (성공/실패)
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    // ✨ 새로운 상태: 인증 로딩 상태
    const [authLoading, setAuthLoading] = useState(false);

    // "내 정보 수정" 버튼 클릭 핸들러
    const handleEditInfoClick = () => {
        setShowPasswordAuth(true); // 비밀번호 입력 섹션 표시
        setAuthMessage(null); // 이전 메시지 초기화
        setCurrentPassword(''); // 비밀번호 입력 필드 초기화
    };

    // 비밀번호 입력 필드 변경 핸들러
    const handlePasswordAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
    };

    // 간편 인증 제출 핸들러
    const handleSimpleAuth = async () => {
        setAuthLoading(true); // 로딩 시작
        setAuthMessage(null); // 메시지 초기화

        // --- 백엔드 연동 전 임시 인증 로직 ---
        // 실제 애플리케이션에서는 이 부분을 백엔드 API 호출로 대체해야 합니다.
        // (예: apiClient.post('/auth/reverify-password', { password: currentPassword }))
        // 비밀번호는 절대 클라이언트에서 하드코딩하거나 비교해서는 안 됩니다.
        await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 지연 시뮬레이션

        if (currentPassword === '') { // ✨ 임시 비밀번호 (실제로는 서버에서 검증)
            setAuthMessage('인증 성공! 정보 수정 페이지로 이동합니다.');
            // 인증 성공 시 실제 정보 수정 페이지로 이동
            navigate('/mypage/editinfo'); // ✨ 새로운 라우트 경로
        } else {
            setAuthMessage('비밀번호가 올바르지 않습니다.');
        }
        setAuthLoading(false); // 로딩 종료
    };


    if (!isLoggedIn) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.message}>로그인이 필요합니다.</p>
                <p className={styles.message}>로그인 후 이용해 주세요.</p>
            </div>
        );
    }

    return (
        <div className={styles.myPageContainer}>
            <h2 className={styles.pageTitle}>마이페이지</h2>
            <div className={styles.userInfoSection}>
                <p><strong>환영합니다, {dummyUserName}!</strong></p>
                <p>이메일: {dummyUserEmail}</p>
                {/* 실제 사용자 정보는 여기에 표시 */}
            </div>

            <div className={styles.menuSection}>
                <h3 className={styles.sectionTitle}>내 정보 관리</h3>
                <ul className={styles.menuList}>
                    <li>
                        <button className={styles.menuButton} onClick={handleEditInfoClick}>
                            내 정보 수정
                        </button>
                    </li>
                    {showPasswordAuth && ( // ✨ 비밀번호 인증 섹션 조건부 렌더링
                        <li className={styles.authSection}>
                            <p className={styles.authPrompt}>정보 수정을 위해 비밀번호를 입력해주세요.</p>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={handlePasswordAuthChange}
                                className={styles.authInputField}
                                placeholder="현재 비밀번호"
                            />
                            <button
                                onClick={handleSimpleAuth}
                                className={styles.authButton}
                                disabled={authLoading}
                            >
                                {authLoading ? '인증 중...' : '간편 인증'}
                            </button>
                            {authMessage && (
                                <p className={authMessage.includes('성공') ? styles.authSuccessMessage : styles.authErrorMessage}>
                                    {authMessage}
                                </p>
                            )}
                        </li>
                    )}
                    <li><button className={styles.menuButton}>비밀번호 변경</button></li>
                    <li><button className={styles.menuButton}>회원 탈퇴</button></li>
                </ul>
            </div>

            <div className={styles.menuSection}>
                <h3 className={styles.sectionTitle}>활동 내역</h3>
                <ul className={styles.menuList}>
                    <li><button className={styles.menuButton}>내가 쓴 리뷰</button></li>
                    <li><button className={styles.menuButton}>찜한 축제/관광지</button></li>
                </ul>
            </div>
        </div>
    );
};

export default MyPage;
