import React, { useState } from 'react';
import { useNavigate, useSearchParams} from 'react-router-dom';
import apiClient from "../api/axiosInstance";
import styles from './User.module.css';
import {useDispatch} from "react-redux";
import { setToken, setUserProfile, setTotalUnreadCount, AppDispatch } from '../store';

const SimpleJoinPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();

    const username = searchParams.get("username") ?? "";
    const email = searchParams.get("email") ?? "";

    const navigate = useNavigate();
    const provider = searchParams.get("provider") ?? "";

    const [firstname, setFirstName] = useState('');
    const [lastname, setLastName] = useState('');
    const [birthdate, setBirthDate] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const getSubmitButtonClass = (provider: string) => {
        switch (provider) {
            case "kakao":
                return `${styles.submitButton} ${styles.kakaoSubmit}`;
            case "google":
                return `${styles.submitButton} ${styles.googleSubmit}`;
            case "naver":
                return `${styles.submitButton} ${styles.naverSubmit}`;
            default:
                return styles.submitButton;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.post('/simplejoin', {
                username,
                email,
                password: password ? password : null,
                firstname,
                lastname,
                birthdate,
                nickname,
            });

            if (response.status === 200) {
                dispatch(setUserProfile(response.data)); // 정보를 저장
                setSuccess('가입이 완료되었습니다.');
                setTimeout(() => {
                    navigate('/userinfo');
                }, 1500);
            }
        } catch (err: any) {
            console.error('가입 실패:', err);

            if (err.response) {
                console.error('Response status:', err.response.status);
                console.error('Response data:', err.response.data);
                setError(`서버 오류: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            } else if (err.request) {
                console.error('No response received:', err.request);
                setError('서버 응답이 없습니다.');
            } else {
                console.error('Error', err.message);
                setError('알 수 없는 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div className={styles.simpleJoinPageContainer}>
            <h2 className={styles.simpleJoinPageTitle}>간편 가입</h2>
            <p className={styles.simpleJoinPageDescription}>
                {username}님, 아래 정보를 입력해 간편하게 가입을 완료하세요.
            </p>

            <form onSubmit={handleSubmit} className={styles.simpleJoinForm}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>First Name</label>
                    <input
                        type="text"
                        className={styles.inputField}
                        value={firstname}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Last Name</label>
                    <input
                        type="text"
                        className={styles.inputField}
                        value={lastname}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Birthdate</label>
                    <input
                        type="date"
                        className={styles.inputField}
                        value={birthdate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nickname</label>
                    <input
                        type="text"
                        className={styles.inputField}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                    />
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}

                <button type="submit" className={getSubmitButtonClass(provider)}>
                    가입하기
                </button>
            </form>
        </div>
    );
};

export default SimpleJoinPage;