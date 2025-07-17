import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/axiosInstance";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setToken, AppDispatch } from '../store';
// ✨ CSS 모듈 임포트 경로 변경: user.module.css 사용
import styles from './User.module.css';

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

    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>{
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

    const handleLogin = async (e: FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        if (!formData.username || !formData.password) {
            setMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.post<LoginResponseData>('/login', formData);

            const successMessage = response.data.message || '로그인 성공!';
            setMessage(successMessage);
            console.log('로그인 성공 응답:', response.data);

            const token = response.headers['authorization'] || response.data.accessToken;

            if (token) {
                localStorage.setItem('jwtToken', token);
                console.log('JWT 토큰 localStorage에 저장됨:', token);
                dispatch(setToken(token));
                console.log('JWT 토큰 Redux Store에 저장됨.');

                setModalMessage(successMessage);
                setShowModal(true);

            } else {
                const noTokenMessage = '로그인 성공했지만 토큰을 받지 못했습니다.';
                setMessage(noTokenMessage);
                setModalMessage(noTokenMessage);
                setShowModal(true);
                console.warn('로그인 성공 응답에 토큰이 없습니다.');
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
        // ✨ 클래스 이름 변경: loginContainer -> authContainer
        <div className={styles.authContainer}>
            <h2>로그인</h2>
            {message && (
                // ✨ 클래스 이름 변경: successMessage/errorMessage
                <p className={message.includes('성공') ? styles.successMessage : styles.errorMessage}>
                    {message}
                </p>
            )}

            {/* ✨ 클래스 이름 변경: loginForm -> authForm */}
            <form onSubmit={handleLogin} className={styles.authForm}>
                <div>
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
                <div>
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
                <div className={styles.buttonContainer} style={{marginBottom:'10px'}}>
                    {/* ✨ 클래스 이름 변경: loginButton -> primaryButton */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.primaryButton}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </div>
            </form>

            <Link to={'/signup'} style={{textDecorationLine:'none'}}>
                <div className={styles.buttonContainer}>
                    {/* ✨ 클래스 이름 변경: signupButton -> secondaryButton */}
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
