import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/axiosInstance";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setToken, setUserProfile, setTotalUnreadCount,AppDispatch } from '../store'; // setUserProfile 임포트
import styles from './User.module.css'; // user.module.css로 임포트 경로 일치

import arirang from '../images/arirang1.png'; // 아리랑 이미지 임포트 유지

interface LoginProps {}
interface LoginFormData {
    username: string;
    password: string;
}
interface LoginResponseData {
    message?: string;
    accessToken?: string;
    role?: string; // 백엔드에서 role을 보내는 경우
    username?: string; // 백엔드에서 username을 보내는 경우
    nickname?: string; // 백엔드에서 닉네임을 보내는 경우
    imageUrl?: string; // 백엔드에서 이미지 URL을 보내는 경우
}

const LoginPage = ({}: LoginProps) => {
    const API_URL = process.env.REACT_APP_API_URL;

    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        password: ''
    });
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    // ✨ 추가: 모달 메시지 유형 상태 (성공/에러)
    const [modalMessageType, setModalMessageType] = useState<'success' | 'error' | null>(null);

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
        setModalMessageType(null); // ✨ 모달 타입 초기화
        if (modalMessageType === 'success') { // ✨ 성공 시에만 이동
            navigate('/');
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        setModalMessageType(null); // ✨ 요청 시작 시 메시지 타입 초기화

        if (!formData.username || !formData.password) {
            setMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setModalMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setModalMessageType('error'); // ✨ 에러 타입 설정
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

                // --- ✨ 여기가 새로 추가된 로직입니다 ---
                // 로그인 성공 직후, 방금 받은 userProfile의 username으로
                //    총 안 읽은 메시지 개수를 요청합니다.
                const unreadCountResponse = await apiClient.get(`/chat/users/${userProfileData.username}/unread-count`);

                // 응답으로 받은 개수({ totalUnreadCount: 5 })를 Redux 스토어에 저장합니다.
                dispatch(setTotalUnreadCount(unreadCountResponse.data.totalUnreadCount));

                setModalMessage(successMessage);
                setModalMessageType('success'); // ✨ 성공 타입 설정
                setShowModal(true);

            } else {
                const noTokenMessage = '로그인 성공했지만 토큰을 받지 못했습니다.';
                setMessage(noTokenMessage);
                setModalMessage(noTokenMessage);
                setModalMessageType('error'); // ✨ 에러 타입 설정
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
            setModalMessageType('error'); // ✨ 에러 타입 설정
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
                    {message}
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
                        {/* ✨ 모달 메시지에 조건부 스타일 클래스 적용 */}
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
