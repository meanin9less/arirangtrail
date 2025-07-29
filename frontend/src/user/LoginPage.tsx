import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom"; // useLocation 임포트
import apiClient from "../api/axiosInstance";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setToken, setUserProfile, setTotalUnreadCount, AppDispatch } from '../store';
import styles from './User.module.css';

import arirang from '../images/arirang1.png';

interface LoginProps {}
interface LoginFormData {
    username: string;
    password: string;
}
interface LoginResponseData {
    message?: string;
    accessToken?: string;
    role?: string;
    username?: string;
    nickname?: string;
    imageUrl?: string;
}

const LoginPage = ({}: LoginProps) => {
    const API_URL = process.env.REACT_APP_API_URL;

    const navigate = useNavigate();
    const location = useLocation(); // URL 정보를 가져오기 위해 useLocation 훅 사용
    const dispatch: AppDispatch = useDispatch();

    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        password: ''
    });
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [modalMessageType, setModalMessageType] = useState<'success' | 'error' | null>(null);
    // ✨ 소셜 로그인 처리 중임을 나타내는 상태 (중복 처리 방지)
    const [isOAuthProcessing, setIsOAuthProcessing] = useState<boolean>(false);

    // ✨ 컴포넌트 마운트 시 URL 쿼리 파라미터 확인 및 소셜 로그인 처리
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        const username = queryParams.get('username');
        const email = queryParams.get('email');
        const nickname = queryParams.get('nickname');
        const provider = queryParams.get('provider');
        const isNewUser = queryParams.get('isNewUser') === 'true';

        // 소셜 로그인 관련 파라미터가 존재하고 아직 처리 중이 아니라면
        if (token || isNewUser) {
            if (isOAuthProcessing) {
                return; // 이미 처리 중이면 중복 실행 방지
            }
            setIsOAuthProcessing(true); // 처리 시작

            console.log('LoginPage: OAuth Callback Detected. Params:', { token, username, email, nickname, provider, isNewUser });

            // URL에서 OAuth 관련 쿼리 파라미터 제거 (URL을 깔끔하게 유지)
            // history.replaceState 대신 navigate를 사용하여 URL 변경
            navigate(location.pathname, { replace: true });

            if (isNewUser) {
                // 신규 사용자일 경우, SimpleJoinPage로 리다이렉트
                if (username && email && provider) {
                    setModalMessage('새로운 사용자입니다. 추가 정보를 입력해주세요.');
                    setModalMessageType('success');
                    setShowModal(true);
                    navigate(`/simplejoin/${username}/${email}/${provider}`, { replace: true });
                } else {
                    console.error('신규 사용자 가입에 필요한 정보가 부족합니다.');
                    setModalMessage('소셜 로그인 정보를 가져오는 데 실패했습니다. 다시 시도해주세요.');
                    setModalMessageType('error');
                    setShowModal(true);
                    setIsOAuthProcessing(false); // 처리 완료
                }
            } else {
                // 기존 사용자일 경우, 로그인 처리
                if (token) {
                    localStorage.setItem('jwtToken', token);
                    dispatch(setToken(token));
                    console.log('JWT 토큰 Redux Store에 저장됨.');

                    const userProfileData = {
                        username: username || 'unknown',
                        nickname: nickname || username || 'unknown',
                        imageUrl: 'https://placehold.co/50x50/cccccc/ffffff?text=User'
                    };
                    dispatch(setUserProfile(userProfileData));
                    console.log('사용자 프로필 Redux Store에 저장됨:', userProfileData);

                    // 총 안 읽은 메시지 개수 요청
                    if (userProfileData.username) {
                        apiClient.get(`/chat/users/${userProfileData.username}/unread-count`)
                            .then(unreadCountResponse => {
                                dispatch(setTotalUnreadCount(unreadCountResponse.data.totalUnreadCount));
                                console.log('총 안 읽은 메시지 개수:', unreadCountResponse.data.totalUnreadCount);
                            })
                            .catch(error => {
                                console.error('안 읽은 메시지 개수를 가져오는 데 실패했습니다:', error);
                                dispatch(setTotalUnreadCount(0));
                            });
                    }

                    setModalMessage('로그인에 성공했습니다!');
                    setModalMessageType('success');
                    setShowModal(true);
                    // 성공 모달이 닫힌 후 navigate('/')가 실행되도록 handleCloseModal에 로직 추가
                } else {
                    console.error('로그인에 실패했습니다: 토큰이 없습니다.');
                    setModalMessage('로그인에 실패했습니다. 다시 시도해주세요.');
                    setModalMessageType('error');
                    setShowModal(true);
                }
                setIsOAuthProcessing(false); // 처리 완료
            }
        }
    }, [location.search, navigate, dispatch, isOAuthProcessing]); // location.search가 변경될 때마다 useEffect 재실행

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
        const {name, value} = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    }

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        // setModalMessageType(null); // 모달 타입은 유지하여 성공/에러에 따른 후속 처리 가능
        if (modalMessageType === 'success') {
            navigate('/'); // 성공 시에만 메인 페이지로 이동
        }
        setModalMessageType(null); // 모달 닫은 후 타입 초기화
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        setModalMessageType(null);

        if (!formData.username || !formData.password) {
            setMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setModalMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setModalMessageType('error');
            setShowModal(true);
            setLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('username', formData.username);
            params.append('password', formData.password);

            const response = await apiClient.post<LoginResponseData>('/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const successMessage = response.data.message || '로그인 성공!';
            setMessage(successMessage);
            console.log('로그인 성공 응답:', response.data);

            const token = response.headers['authorization'] || response.data.accessToken;

            if (token) {
                localStorage.setItem('jwtToken', token);
                console.log('JWT 토큰 localStorage에 저장됨:', token);
                dispatch(setToken(token));
                console.log('JWT 토큰 Redux Store에 저장됨.');

                const userProfileData = {
                    username: response.data.username || formData.username,
                    nickname: response.data.nickname || formData.username,
                    imageUrl: response.data.imageUrl || 'https://placehold.co/50x50/cccccc/ffffff?text=User'
                };
                dispatch(setUserProfile(userProfileData));
                console.log('사용자 프로필 Redux Store에 저장됨:', userProfileData);

                const unreadCountResponse = await apiClient.get(`/chat/users/${userProfileData.username}/unread-count`);
                dispatch(setTotalUnreadCount(unreadCountResponse.data.totalUnreadCount));

                setModalMessage(successMessage);
                setModalMessageType('success');
                setShowModal(true);

            } else {
                const noTokenMessage = '로그인 성공했지만 토큰을 받지 못했습니다.';
                setMessage(noTokenMessage);
                setModalMessage(noTokenMessage);
                setModalMessageType('error');
                setShowModal(true);
                console.warn('로그인 성공 응답에 토큰이 없습니다.');
            }

        } catch (error: any) {
            console.error('로그인 오류:', error);
            let errorMessage = '로그인 실패: 네트워크 오류 또는 알 수 없는 오류가 발생했습니다.';

            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.error || error.response.data?.message || '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.';
            }
            setMessage(errorMessage);
            setModalMessage(errorMessage);
            setModalMessageType('error');
            setShowModal(true);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            <img src={arirang} alt="아리랑 이미지" className={styles.arirangImage} />

            <h2>로그인</h2>
            {message && (
                <p className={message.includes('성공') ? styles.successMessage : styles.errorMessage}>
                    {'아이디 또는 비밀번호가 일치하지 않거나 없는계정입니다.'}
                </p>
            )}

            <form onSubmit={handleLogin} className={styles.authForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="username">아이디:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="아이디를 입력하세요"
                        className={styles.inputField}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="password">비밀번호:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="비밀번호를 입력하세요"
                        className={styles.inputField}
                    />
                </div>
                <div className={`${styles.buttonContainer} ${styles.loginButtonMargin}`}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.primaryButton}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </div>
            </form>

            <div className={styles.divider}>
                <span className={styles.dividerText}>또는</span>
            </div>

            <div className={styles.oauthButtonsContainer}>
                <a href={`${API_URL}/oauth2/authorization/naver`} className={styles.oauthButtonNaver}>
                    네이버 로그인
                </a>
                <a href={`${API_URL}/oauth2/authorization/kakao`} className={styles.oauthButtonKakao}>
                    카카오 로그인
                </a>
                <a href={`${API_URL}/oauth2/authorization/google`} className={styles.oauthButtonGoogle}>
                    구글 로그인
                </a>
            </div>

            <p className={styles.signupLinkText}>
                <Link to={'/join'} className={styles.signupLink}>
                    새 계정 만들기 (회원가입)
                </Link>
            </p>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>알림</h3>
                        <p className={modalMessageType === 'success' ? styles.successMessage : styles.errorMessage}>
                            {modalMessage}
                        </p>
                        <button
                            onClick={handleCloseModal}
                            className={styles.modalButton}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
