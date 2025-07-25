import React, { useState } from 'react';
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import axios from 'axios';
import styles from './User.module.css';

const SimpleJoinPage: React.FC = () => {
    const [searchParams] = useSearchParams();

    const username = searchParams.get("username") ?? "";
    const email = searchParams.get("email") ?? "";

    const navigate = useNavigate();

    const [firstname, setFirstName] = useState('');
    const [lastname, setLastName] = useState('');
    const [birthdate, setBirthDate] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('/join', {
                username,
                email,
                firstname,
                lastname,
                birthdate,
                nickname,
            });

            if (response.status === 200) {
                setSuccess('가입이 완료되었습니다.');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (err) {
            console.error('가입 실패:', err);
            setError('가입 중 오류가 발생했습니다. 다시 시도해주세요.');
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

                <button type="submit" className={styles.submitButton}>
                    가입하기
                </button>
            </form>
        </div>
    );
};

export default SimpleJoinPage;
