import React, { useState } from 'react';
import styles from './MyPage.module.css';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';

const DeleteAccountPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const username = useSelector((state: RootState) => state.token.userProfile?.username);

    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!username) {
        return <p>로그인 정보가 없습니다.</p>;
    }

    const handleCancel = () => {
        navigate('/mypage'); // 마이페이지로 돌아가기
    };

    const handleDelete = async () => {
        setLoading(true);
        setMessage(null);
        if (!password.trim()) {
            setMessage('비밀번호를 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            const verifyResp = await apiClient.post<boolean>(
                `/compare-password?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
                null
            );
            if (verifyResp.status === 200 && verifyResp.data === true) {
                const deleteResp = await apiClient.delete<string>(`/delete-member?username=${encodeURIComponent(username)}`);
                if (deleteResp.status === 200) {
                    setMessage('회원탈퇴가 완료되었습니다. 3초 후 로그아웃 됩니다.');
                    setTimeout(() => {
                        dispatch({ type: 'LOGOUT' });
                        navigate('/login');
                    }, 3000);
                } else {
                    setMessage('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
                }
            } else {
                setMessage('비밀번호가 일치하지 않습니다.');
            }
        } catch (error: any) {
            let msg = '회원탈퇴 실패: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                msg = error.response.data?.message || msg;
            }
            setMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authSection}>
            <p className={styles.authPrompt}>회원탈퇴를 위해 비밀번호를 입력해주세요.</p>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.authInputField}
                placeholder="비밀번호"
                disabled={loading}
            />
            <button onClick={handleDelete} className={styles.authButton} disabled={loading}>
                {loading ? '진행 중...' : '회원 탈퇴'}
            </button>
            <button onClick={handleCancel} className={styles.cancelButton} disabled={loading}>
                취소
            </button>
            {message && (
                <p className={message.includes('완료') ? styles.authSuccessMessage : styles.authErrorMessage}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default DeleteAccountPage;
