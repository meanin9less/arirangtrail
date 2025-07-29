import React, { useState, useEffect } from 'react';
import styles from './MyPage.module.css'; // 마이페이지 스타일 임포트
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // Redux RootState 임포트
import { useNavigate } from 'react-router-dom'; // useNavigate 훅 임포트
import apiClient from '../api/axiosInstance'; // API 클라이언트 임포트
import axios from 'axios'; // axios.isAxiosError를 위해

// ✨ 1. 백엔드 API 응답 및 요청에 사용할 DTO 인터페이스 정의
interface UserProfileResponseDto {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    nickname: string;
    imageUrl?: string;
}


type PasswordVerificationResponseDto = boolean;

const MyPage: React.FC = () => {
    const navigate = useNavigate();

    // Redux store에서 JWT 토큰 가져오기 (로그인 여부 확인용)
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;
    // Redux store에서 사용자 프로필 정보 가져오기 (초기 로딩 시 활용)
    const storedUserProfile = useSelector((state: RootState) => state.token.userProfile);

    // 사용자 정보 상태
    const [userName, setUserName] = useState<string | null>(storedUserProfile?.nickname || storedUserProfile?.username || null);
    const [userEmail, setUserEmail] = useState<string | null>(storedUserProfile?.email || null); // email은 UserProfileResponseDto에 있으므로 추가
    const [userProfileImage, setUserProfileImage] = useState<string | null>(storedUserProfile?.imageUrl || null); // 프로필 이미지 URL 추가

    const [loadingUserInfo, setLoadingUserInfo] = useState<boolean>(true);
    const [userInfoError, setUserInfoError] = useState<string | null>(null);

    // 컴포넌트 마운트 시 또는 로그인 상태 변경 시 사용자 정보 가져오기
    useEffect(() => {
        if (isLoggedIn) {
            const fetchUserInfo = async () => {
                try {
                    setLoadingUserInfo(true);
                    setUserInfoError(null);

                    // ✅ username 파라미터 제거
                    const response = await apiClient.get<UserProfileResponseDto>('/userinfo');

                    setUserName(response.data.nickname || response.data.username);
                    setUserEmail(response.data.email);
                    setUserProfileImage(
                        response.data.imageUrl || 'https://placehold.co/100x100/cccccc/ffffff?text=User'
                    );

                    setLoadingUserInfo(false);
                } catch (error: any) {
                    console.error('사용자 정보 불러오기 오류:', error);
                    let errorMessage = '사용자 정보를 불러오는 데 실패했습니다: 네트워크 오류 또는 알 수 없는 오류';
                    if (axios.isAxiosError(error) && error.response) {
                        errorMessage =
                            error.response.data?.message || '사용자 정보를 불러오는 데 실패했습니다: 서버 오류';
                    }
                    setUserInfoError(errorMessage);
                    setLoadingUserInfo(false);
                }
            };

            fetchUserInfo();
        } else {
            setUserName(null);
            setUserEmail(null);
            setUserProfileImage(null);
            setLoadingUserInfo(false);
            setUserInfoError(null);
        }
    }, [isLoggedIn]); // isLoggedIn과 storedUserProfile 변경 시 실행

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
        setAuthLoading(true);
        setAuthMessage(null);

        if (!currentPassword.trim()) {
            setAuthMessage('비밀번호를 입력해주세요.');
            setAuthLoading(false);
            return;
        }

        try {
            // username을 쿼리 파라미터로 보내고, body는 빈값 또는 null로 보내기
            const username = storedUserProfile?.username;
            if (!username) {
                setAuthMessage('사용자 정보가 없습니다.');
                setAuthLoading(false);
                return;
            }

            // 쿼리 스트링 직접 작성
            const response = await apiClient.post<boolean>(
                `/compare-password?username=${encodeURIComponent(username)}&password=${encodeURIComponent(currentPassword)}`,
                null
            );

            if (response.status === 200 && response.data === true) {
                setAuthMessage('비밀번호 일치');
                navigate('/mypage/editinfo');
            } else {
                setAuthMessage('비밀번호가 일치하지 않습니다.');
            }
        } catch (error: any) {
            console.error('비밀번호 인증 오류:', error);
            let msg = '비밀번호 인증 실패: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                msg = error.response.data?.message || '비밀번호가 올바르지 않습니다.';
            }
            setAuthMessage(msg);
        } finally {
            setAuthLoading(false);
        }
    };

    // 로그인되지 않은 경우
    if (!isLoggedIn) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.message}>로그인이 필요합니다.</p>
                <p className={styles.message}>로그인 후 이용해 주세요.</p>
            </div>
        );
    }

    // 사용자 정보 로딩 중일 때 표시
    if (loadingUserInfo) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.message}>사용자 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    // 사용자 정보 로딩 에러 발생 시 표시
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
                {/* 프로필 이미지 표시 (없으면 기본 플레이스홀더) */}
                <img
                    src={userProfileImage || 'https://placehold.co/100x100/cccccc/ffffff?text=User'}
                    alt="프로필 이미지"
                    className={styles.profileImage}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // 무한 루프 방지
                        target.src = 'https://placehold.co/100x100/cccccc/ffffff?text=User'; // 이미지 로드 실패 시 기본 이미지
                    }}
                />
                <p><strong>환영합니다, {userName || '사용자'}!</strong></p>
                <p>이메일: {userEmail || '정보 없음'}</p>
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
                                <p className={typeof authMessage === 'string' && (authMessage.includes('성공') || authMessage.includes('일치')) ? styles.authSuccessMessage : styles.authErrorMessage}>
                                    {authMessage}
                                </p>
                            )}
                        </li>
                    )}
                    <li><button className={styles.menuButton}
                                onClick={()=>navigate('/mypage/passwordchange')}>
                        비밀번호 변경</button></li>
                    <li><button className={styles.menuButton}
                                onClick={() => navigate('/mypage/delete-account')}>
                        회원 탈퇴</button></li>
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
