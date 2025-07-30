import React, { useState, useEffect } from 'react';
import styles from './MyPage.module.css';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';

// 백엔드 API 응답 및 요청에 사용할 DTO 인터페이스 정의 (store.ts의 userProfile 타입과 일치해야 함)
interface UserProfileResponseDto {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    nickname: string;
    birthdate: string; // MyPage에서 사용하진 않지만, 타입 일관성을 위해 추가
    imageUrl?: string;
}

const MyPage: React.FC = () => {
    const navigate = useNavigate();

    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;
    // Redux store에서 사용자 프로필 정보 가져오기 (초기 로딩 시 활용)
    const storedUserProfile = useSelector((state: RootState) => state.token.userProfile);

    // 사용자 정보 상태 (storedUserProfile을 초기값으로 사용)
    const [userName, setUserName] = useState<string | null>(storedUserProfile?.nickname || storedUserProfile?.username || null);
    const [userEmail, setUserEmail] = useState<string | null>(storedUserProfile?.email || null);
    const [userProfileImage, setUserProfileImage] = useState<string | null>(storedUserProfile?.imageUrl || null);

    const [loadingUserInfo, setLoadingUserInfo] = useState<boolean>(true);
    const [userInfoError, setUserInfoError] = useState<string | null>(null);

    // 컴포넌트 마운트 시 또는 로그인/저장된 프로필 상태 변경 시 사용자 정보 가져오기
    useEffect(() => {
        if (isLoggedIn) {
            const fetchUserInfo = async () => {
                try {
                    setLoadingUserInfo(true);
                    setUserInfoError(null);

                    // API 호출을 통해 최신 사용자 정보를 가져옴
                    const response = await apiClient.get<UserProfileResponseDto>('/userinfo', {
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                        },
                    });

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

            // isLoggedIn 또는 storedUserProfile이 변경될 때 fetchUserInfo 호출
            // 이렇게 하면 EditInfoPage에서 Redux Store를 업데이트하면 MyPage가 자동으로 반응합니다.
            fetchUserInfo();

        } else {
            setUserName(null);
            setUserEmail(null);
            setUserProfileImage(null);
            setLoadingUserInfo(false);
            setUserInfoError(null);
        }
    }, [isLoggedIn, jwtToken, storedUserProfile]); // ✨ storedUserProfile을 의존성 배열에 추가

    const [showPasswordAuth, setShowPasswordAuth] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(false);

    const handleEditInfoClick = () => {
        setShowPasswordAuth(true);
        setAuthMessage(null);
        setCurrentPassword('');
    };

    const handlePasswordAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
    };

    const handleSimpleAuth = async () => {
        setAuthLoading(true);
        setAuthMessage(null);

        if (!currentPassword.trim()) {
            setAuthMessage('비밀번호를 입력해주세요.');
            setAuthLoading(false);
            return;
        }

        try {
            const username = storedUserProfile?.username;
            if (!username) {
                setAuthMessage('사용자 정보가 없습니다.');
                setAuthLoading(false);
                return;
            }

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

    if (!isLoggedIn) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.message}>로그인이 필요합니다.</p>
                <p className={styles.message}>로그인 후 이용해 주세요.</p>
            </div>
        );
    }

    if (loadingUserInfo) {
        return (
            <div className={styles.myPageContainer}>
                <h2 className={styles.pageTitle}>마이페이지</h2>
                <p className={styles.message}>사용자 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

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
                <img
                    src={userProfileImage || 'https://placehold.co/100x100/cccccc/ffffff?text=User'}
                    alt="프로필 이미지"
                    className={styles.profileImage}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/100x100/cccccc/ffffff?text=User';
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
                    {showPasswordAuth && (
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
                        비밀번호 변경</button>
                    </li>
                    <li><button className={styles.menuButton}
                                onClick={() => navigate('/mypage/delete-account')}>
                        회원 탈퇴</button>
                    </li>
                </ul>
            </div>

            <div className={styles.menuSection}>
                <h3 className={styles.sectionTitle}>활동 내역</h3>
                <ul className={styles.menuList}>
                    <li><button className={styles.menuButton}
                                onClick={() => navigate('/mypage/my-reviews')}>
                        내가 쓴 리뷰</button>
                    </li>
                    <li><button className={styles.menuButton}
                                onClick={() => navigate('/mypage/liked-festivals')}>
                        찜한 축제/관광지</button>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default MyPage;