import React, { useState } from 'react';
import styles from './MyPage.module.css'; // 마이페이지 스타일 임포트
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // Redux RootState 임포트
import { useNavigate } from 'react-router-dom'; // useNavigate 훅 임포트
import apiClient from '../api/axiosInstance'; // API 클라이언트 임포트 (추가)
import axios from 'axios'; // axios.isAxiosError를 위해 (추가)

const MyPage: React.FC = () => {
    const navigate = useNavigate();

    // Redux store에서 JWT 토큰 가져오기 (로그인 여부 확인용)
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;

    // 사용자 정보는 백엔드에서 가져와야 합니다.
    // [백엔드 연동 필요] 실제 사용자 정보를 저장할 상태 (초기값은 null 또는 빈 객체)
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loadingUserInfo, setLoadingUserInfo] = useState<boolean>(true);
    const [userInfoError, setUserInfoError] = useState<string | null>(null);

    // [백엔드 연동 필요] 컴포넌트 마운트 시 사용자 정보 가져오기 (useEffect 필요)
    // 현재는 더미 데이터로 즉시 설정
    React.useEffect(() => {
        if (isLoggedIn) {
            // 실제로는 여기에 백엔드 API 호출 로직이 들어갑니다.
            // 예: const fetchUserInfo = async () => { ... }; fetchUserInfo();
            setUserName("준홍님"); // 임시 더미 데이터
            setUserEmail("junhong@example.com"); // 임시 더미 데이터
            setLoadingUserInfo(false);
        } else {
            setLoadingUserInfo(false); // 로그인 안 된 상태면 로딩 종료
        }
    }, [isLoggedIn]); // 로그인 상태 변경 시 실행

    // 비밀번호 인증 섹션 표시 여부
    const [showPasswordAuth, setShowPasswordAuth] = useState(false);
    // 비밀번호 입력 값
    const [currentPassword, setCurrentPassword] = useState('');
    // 인증 메시지 (성공/실패)
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    // 인증 로딩 상태
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

        // [백엔드 연동 필요] 이 부분은 실제 백엔드 API 호출로 대체해야 합니다.
        // 현재는 임시로 0.5초 지연 후 '1234'와 비교합니다.
        // 예: try { const response = await apiClient.post('/auth/reverify-password', { password: currentPassword }); ... }
        // 비밀번호는 절대 클라이언트에서 하드코딩하거나 비교해서는 안 됩니다.
        await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 지연 시뮬레이션

        if (currentPassword === '1234') { // 임시 비밀번호 '1234' (실제로는 서버에서 검증)
            setAuthMessage('인증 성공! 정보 수정 페이지로 이동합니다.');
            navigate('/mypage/editinfo');
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

    // [백엔드 연동 필요] 사용자 정보 로딩 중일 때 표시
    if (loadingUserInfo) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.message}>사용자 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    // [백엔드 연동 필요] 사용자 정보 로딩 에러 발생 시 표시
    if (userInfoError) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.errorMessage}>{userInfoError}</p>
            </div>
        );
    }

    return (
        <div className={styles.myPageContainer}>
            <h2 className={styles.pageTitle}>마이페이지</h2>
            <div className={styles.userInfoSection}>
                <p><strong>환영합니다, {userName || '사용자'}!</strong></p> {/* userName 상태 사용 */}
                <p>이메일: {userEmail || '정보 없음'}</p> {/* userEmail 상태 사용 */}
                {/* [백엔드 연동 필요] 실제 사용자 정보는 여기에 표시됩니다. */}
            </div>

            <div className={styles.menuSection}>
                <h3 className={styles.sectionTitle}>내 정보 관리</h3>
                <ul className={styles.menuList}>
                    <li>
                        <button className={styles.menuButton} onClick={handleEditInfoClick}>
                            내 정보 수정
                        </button>
                    </li>
                    {showPasswordAuth && ( // 비밀번호 인증 섹션 조건부 렌더링
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
