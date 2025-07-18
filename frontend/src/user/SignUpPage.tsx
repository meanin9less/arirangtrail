import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './User.module.css'; // User.module.css로 임포트 경로 일치

interface JoinFormData {
    username: string; // userId -> username
    password: string;
    email: string;
    firstname: string; // firstName -> firstname
    lastname: string;  // lastName -> lastname
    birthdate: string; // dateOfBirth -> birthdate
    nickname: string;  // 새로 추가된 필드
}

interface JoinResponse {
    message: string;
}

function JoinPage() { // 컴포넌트 함수 이름은 JoinPage로 유지합니다.
    const navigate = useNavigate();

    const [formData, setFormData] = useState<JoinFormData>({
        username: '',
        password: '',
        email: '',
        firstname: '',
        lastname: '',
        birthdate: '',
        nickname: '',
    });

    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        if (message && message.includes('성공')) {
            navigate('/login');
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setMessage(null);
        setLoading(true);

        // console.log('회원가입 데이터:', formData); // 개발용 로그는 제거

        try {
            // [백엔드 연동 필요] 실제 회원가입 API 엔드포인트로 변경하세요.
            // 예: const response = await apiClient.post<JoinResponse>('/api/signup', formData);
            const response = await apiClient.post<JoinResponse>('http://localhost:8080/signup', formData);

            const successMessage = response.data.message || '회원가입 성공!';
            setMessage(successMessage);
            setModalMessage(successMessage + ' 로그인 페이지로 이동합니다.');
            setShowModal(true);

        } catch (error: any) {
            console.error('회원가입 오류:', error);

            let errorMessage = '회원가입 실패: 네트워크 오류 또는 알 수 없는 오류가 발생했습니다.';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.message || '회원가입 실패: 아이디 또는 비밀번호를 확인해주세요.';
            }
            setMessage(errorMessage);
            setModalMessage(errorMessage);
            setShowModal(true);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <h2>회원가입</h2>

            {message && (
                <p className={message.includes('성공') ? styles.successMessage : styles.errorMessage}>
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit} className={styles.authForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="username">아이디:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="User Name"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password">비밀번호:</label>
                    <input type="password" id="password" name="password" placeholder='Password'
                           value={formData.password} onChange={handleChange} required className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email">이메일:</label>
                    <input type="email" id="email" name="email" placeholder='Email'
                           value={formData.email} onChange={handleChange} required className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="firstname">성:</label>
                    <input type="text" id="firstname" name="firstname" placeholder='First Name'
                           value={formData.firstname} onChange={handleChange} required className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="lastname">이름:</label>
                    <input type="text" id="lastname" name="lastname" placeholder='Last Name'
                           value={formData.lastname} onChange={handleChange} required className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="birthdate">생년월일:</label>
                    <input type="date" id="birthdate" name="birthdate" placeholder='생년월일'
                           value={formData.birthdate} onChange={handleChange} required className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="nickname">닉네임:</label>
                    <input type="text" id="nickname" name="nickname" placeholder='NickName'
                           value={formData.nickname} onChange={handleChange} required className={styles.inputField}
                    />
                </div>

                <div className={styles.buttonContainer}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.primaryButton}
                    >
                        {loading ? '회원가입 중...' : '회원가입'}
                    </button>
                </div>
            </form>

            <p className={styles.loginLinkText}>
                <Link to="/login" className={styles.loginLink}>
                    이미 계정이 있으신가요? 로그인
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
}

export default JoinPage;
