import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './User.module.css';

interface JoinFormData {
    username: string;
    password: string;
    email: string;
    firstname: string;
    lastname: string;
    birthdate: string;
    nickname: string;
}

interface JoinResponse {
    message: string;
}

function JoinPage() {
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
            navigate('/login'); // 회원가입 성공 시 로그인 페이지로 이동
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setMessage(null);
        setLoading(true);

        console.log('회원가입 데이터:', formData);

        try {
            const response = await apiClient.post<JoinResponse>('api/join', formData);

            const successMessage = response.data.message || '회원가입 성공!';
            setMessage(successMessage);
            setModalMessage(successMessage + ' 로그인 페이지로 이동합니다.');
            setShowModal(true);

        } catch (error: any) {
            console.error('회원가입 오류:', error);

            let errorMessage = '회원가입 실패: 네트워크 오류 또는 알 수 없는 오류가 발생했습니다.';
            if (axios.isAxiosError(error) && error.response) {
                // 서버에서 구체적인 에러 메시지를 반환한다면 사용
                errorMessage = error.response.data?.message || '회원가입 실패: 서버 오류 (데이터 형식 확인)';
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
                        id="username" //
                        name="username" //
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password">비밀번호:</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className={styles.inputField} />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email">이메일:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={styles.inputField} />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="firstname">성:</label>
                    <input type="text" id="firstname" name="firstname" value={formData.firstname} onChange={handleChange} required className={styles.inputField} /> {/* ✨ id, name도 firstname으로 변경 */}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="lastname">이름:</label>
                    <input type="text" id="lastname" name="lastname" value={formData.lastname} onChange={handleChange} required className={styles.inputField} /> {/* ✨ id, name도 lastname으로 변경 */}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="birthdate">생년월일:</label>
                    <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange} required className={styles.inputField} /> {/* ✨ id, name도 birthdate로 변경 */}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="nickname">닉네임:</label>
                    <input type="text" id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} required className={styles.inputField} />
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
