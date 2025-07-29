import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from "../api/axiosInstance";
// import './ChangePasswordPage.css';

const ChangePasswordPage = () => {
    const { username, email } = useParams();
    const navigate = useNavigate();

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
            const response = await apiClient.post('/reset-pw', {
                username,
                email,
                password
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
        <div className="changePasswordContainer">
            <h2 className="pageTitle">비밀번호 변경</h2>
            <form onSubmit={handleSubmit}>
                <div className="formGroup">
                    <label className="label">새 비밀번호</label>
                    <input
                        type="password"
                        className="inputField"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="formGroup">
                    <label className="label">비밀번호 확인</label>
                    <input
                        type="password"
                        className="inputField"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className="errorMessage">{error}</div>}
                {success && <div className="successMessage">{success}</div>}

                <div className="buttonContainer">
                    <button type="submit" className="submitButton">
                        비밀번호 변경
                    </button>
                    <button
                        type="button"
                        className="cancelButton"
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
