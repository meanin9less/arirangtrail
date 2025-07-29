import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import apiClient from "../api/axiosInstance";
import { useSelector } from "react-redux";
import styles from './PasswordChangePage.module.css';  // CSS 모듈 import

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const username = useSelector((state: RootState) => state.token.userProfile?.username ?? '');

    // 여기서부터 추가된 부분 시작
    const [step, setStep] = useState<1 | 2>(1);
    const [currentPassword, setCurrentPassword] = useState('');
    // 여기까지 추가된 부분 끝

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 현재 비밀번호 확인 함수 추가
    const handleVerifyCurrentPassword = async () => {
        setError('');
        try {
            const response = await apiClient.post('/compare-password', null, {
                params: {
                    username,
                    password: currentPassword,
                }
            });

            // 서버에서 boolean(true/false) 반환한다고 가정
            if (response.status === 200 && response.data === true) {
                setStep(2);
                setError('');
            } else {
                setError('현재 비밀번호가 일치하지 않습니다.');
            }
        } catch (e) {
            setError('비밀번호 확인 중 오류가 발생했습니다.');
        }
    };

    // 기존 handleSubmit 그대로 유지 (step 2일 때 비밀번호 변경)
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
                    navigate('/mypage');
                }, 2000);
            }
        } catch (err) {
            setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className={styles.changePasswordContainer}>
            <h2 className={styles.pageTitle}>비밀번호 변경</h2>

            {step === 1 && (
                <>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>현재 비밀번호</label>
                        <input
                            type="password"
                            className={styles.inputField}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    <div className={styles.buttonContainer}>
                        <button
                            type="button"
                            className={styles.submitButton}
                            onClick={handleVerifyCurrentPassword}
                        >
                            확인
                        </button>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={() => navigate('/mypage')}
                        >
                            취소
                        </button>
                    </div>
                </>
            )}

            {step === 2 && (
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
                            onClick={() => navigate('/mypage')}
                        >
                            취소
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ChangePasswordPage;
