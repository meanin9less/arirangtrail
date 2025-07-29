import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import apiClient from "../api/axiosInstance";
import { useSelector } from "react-redux";
import styles from './PasswordChangePage.module.css';  // CSS 모듈 import

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const username = useSelector((state: RootState) => state.token.userProfile?.username ?? '');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await apiClient.put('/reset-pw', null, {
                params: {
                    username,
                    password,
                },
            });

            if (response.status === 200) {
                setSuccess('비밀번호가 성공적으로 변경되었습니다.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className={styles.changePasswordContainer}>
            <h2 className={styles.pageTitle}>비밀번호 변경</h2>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>새 비밀번호</label>
                    <input
                        type="password"
                        className={styles.inputField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>비밀번호 확인</label>
                    <input
                        type="password"
                        className={styles.inputField}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}

                <div className={styles.buttonContainer}>
                    <button type="submit" className={styles.submitButton}>
                        비밀번호 변경
                    </button>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => navigate('/login')}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordPage;
