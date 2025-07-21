import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/axiosInstance";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setToken, AppDispatch } from '../store';
import styles from './User.module.css'; // user.module.css 사용

import arirang from '../images/arirang1.png'; // 아리랑 이미지 임포트 유지

interface LoginFormData {
    username: string;
    password: string;
}
interface LoginResponseData {
    message?: string;
    accessToken?: string; // 백엔드에서 이 필드로 토큰을 보낼 경우
    token?: string; // 혹은 'token'이라는 필드로 보낼 경우
}

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    // 전통 로그인 폼 데이터 상태
    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        password: ''
    });
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');

    // 백엔드 OAuth 2.0 인증 엔드포인트의 기본 URL
    // 실제 배포 시에는 'http://localhost:8080' 대신 실제 서버 주소로 변경해야 합니다.
    const BACKEND_OAUTH_BASE_URL = "http://localhost:8080";

    // 전통 로그인 폼 입력 변경 핸들러
    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>{
        const {name, value} = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    }

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        // 로그인 성공 시에만 홈으로 이동 (전통 로그인 시)
        if (message && message.includes('성공') && !message.includes('OAuth')) { // OAuth 성공 메시지와 구분
            navigate('/');
        }
    };

    // 전통 로그인 폼 제출 핸들러
    const handleTraditionalLogin = async (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        if (!formData.username || !formData.password) {
            setMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            // 전통 로그인 API 엔드포인트로 요청
            const response = await apiClient.post<LoginResponseData>('/api/login', formData);

            const successMessage = response.data.message || '로그인 성공!';
            setMessage(successMessage);
            console.log('로그인 성공 응답 (전통):', response.data);

            // 토큰 추출: 'Authorization' 헤더 또는 'accessToken'/'token' 필드에서 시도
            const token = response.headers['authorization'] || response.data.accessToken || response.data.token;

            if (token) {
                localStorage.setItem('jwtToken', token);
                console.log('JWT 토큰 localStorage에 저장됨:', token);
                dispatch(setToken(token));
                console.log('JWT 토큰 Redux Store에 저장됨.');

                setModalMessage(successMessage);
                setShowModal(true);

            } else {
                const noTokenMessage = '로그인 성공했지만 토큰을 받지 못했습니다. (서버 응답 확인 필요)';
                setMessage(noTokenMessage);
                setModalMessage(noTokenMessage);
                setShowModal(true);
                console.warn('로그인 성공 응답에 토큰이 없습니다.');
            }

        } catch (error: any) {
            console.error('로그인 오류 (전통):', error);
            let errorMessage = '로그인 실패: 네트워크 오류 또는 알 수 없는 오류가 발생했습니다.';

            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.message || '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.';
            }
            setMessage(errorMessage);
            setModalMessage(errorMessage);
            setShowModal(true);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            {/* 아리랑 이미지 추가 */}
            <img src={arirang} alt="아리랑 이미지" className={styles.arirangImage} />

            <h2>로그인</h2>
            {message && (
                <p className={message.includes('성공') ? styles.successMessage : styles.errorMessage}>
                    {message}
                </p>
            )}

            {/* ✨ 전통 로그인 폼 */}
            <form onSubmit={handleTraditionalLogin} className={styles.authForm}>
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

            {/* ✨ 구분선 또는 텍스트 */}
            <div className={styles.divider}>
                <span className={styles.dividerText}>또는</span>
            </div>

            {/* ✨ OAuth 2.0 로그인 버튼들 */}
            <div className={styles.oauthButtonsContainer}>
                <a href={`${BACKEND_OAUTH_BASE_URL}/oauth2/authorization/naver`} className={styles.oauthButtonNaver}>
                    네이버 로그인
                </a>
                <a href={`${BACKEND_OAUTH_BASE_URL}/oauth2/authorization/kakao`} className={styles.oauthButtonKakao}>
                    카카오 로그인
                </a>
                <a href={`${BACKEND_OAUTH_BASE_URL}/oauth2/authorization/google`} className={styles.oauthButtonGoogle}>
                    구글 로그인
                </a>
            </div>

            {/* 회원가입 링크 */}
            <p className={styles.signupLinkText}>
                <Link to={'/join'} className={styles.signupLink}>
                    새 계정 만들기 (회원가입)
                </Link>
            </p>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>알림</h3>
                        <p>{modalMessage}</p>
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
