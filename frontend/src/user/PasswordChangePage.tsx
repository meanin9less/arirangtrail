import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import style from "./PasswordChangePage.module.css";
import apiClient from "../api/axiosInstance";

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState(""); // 실제로는 전역 또는 세션에서 가져오는 게 좋음
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            setSuccess("");
            return;
        }

        try {
            const response = await apiClient.put(`/reset-pw`, null, {
                params: {
                    username,
                    password,
                },
            });

            if (response.status === 200) {
                setSuccess("비밀번호가 성공적으로 변경되었습니다.");
                setError("");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (err) {
            setError("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
            setSuccess("");
        }
    };

    return (
        <div className={style.changePasswordContainer}>
            <h2 className={style.pageTitle}>비밀번호 변경</h2>
            <form onSubmit={handleSubmit}>
                <div className={style.formGroup}>
                    <label className={style.label}>아이디</label>
                    <input
                        type="text"
                        className={style.inputField}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className={style.formGroup}>
                    <label className={style.label}>새 비밀번호</label>
                    <input
                        type="password"
                        className={style.inputField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={style.formGroup}>
                    <label className={style.label}>비밀번호 확인</label>
                    <input
                        type="password"
                        className={style.inputField}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className={style.errorMessage}>{error}</div>}
                {success && <div className={style.successMessage}>{success}</div>}

                <div className={style.buttonContainer}>
                    <button type="submit" className={style.submitButton}>
                        비밀번호 변경
                    </button>
                    <button
                        type="button"
                        className={style.cancelButton}
                        onClick={() => navigate("/mypage")}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordPage;
