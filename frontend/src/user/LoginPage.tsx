import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/axiosInstance";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setToken, AppDispatch } from '../store';
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
}

const LoginPage = ({}: LoginProps) => {

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
        if (message && message.includes('성공')) {
            navigate('/');
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        if (!formData.username || !formData.password) {
            setMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            // [백엔드 연동 필요] 실제 로그인 API 엔드포인트로 변경하세요.
            // 예: const response = await apiClient.post<LoginResponseData>('/api/login', formData);
            const response = await apiClient.post<LoginResponseData>('http://localhost:8080/login', formData);

            const successMessage = response.data.message || '로그인 성공!';
            setMessage(successMessage);

            const token = response.headers['authorization'] || response.data.accessToken;

            if (token) {
                localStorage.setItem('jwtToken', token);
                dispatch(setToken(token));
                setModalMessage(successMessage);
                setShowModal(true);

            } else {
                const noTokenMessage = '로그인 성공했지만 토큰을 받지 못했습니다.';
                setMessage(noTokenMessage);
                setModalMessage(noTokenMessage);
                setShowModal(true);
            }

        } catch (error: any) {
            console.error('로그인 오류:', error);
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
                <div className={`${styles.buttonContainer} ${styles.loginButtonMargin}`}> {/* 인라인 스타일을 클래스로 변경 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.primaryButton}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </div>
            </form>

            <Link to={'/signup'} className={styles.noTextDecoration}> {/* 인라인 스타일을 클래스로 변경 */}
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.secondaryButton}
                    >
                        회원가입
                    </button>
                </div>
            </Link>

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
