import React, { useState } from "react";
import apiClient from '../api/axiosInstance'; // API 클라이언트 임포트
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from '../store'; // Redux RootState 임포트

const PasswordChangePage: React.FC = () => {
    const [step, setStep] = useState<"verify" | "change">("verify");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const username = useSelector((state: RootState) => state.token.userProfile?.username);
    const navigate = useNavigate();

    const handleVerify = async () => {
        try {
            setError("");
            const res = await apiClient.post("/compare-password", null, {
                params: {
                    username,
                    password: currentPassword,
                },
            });

            if (res.data === true) {
                setStep("change");
            } else {
                setError("비밀번호가 일치하지 않습니다.");
            }
        } catch (err) {
            setError("비밀번호 확인 중 오류가 발생했습니다.");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            setError("");
            await apiClient.put("/reset-pw", null, {
                params: {
                    username,
                    password: newPassword,
                },
            });
            alert("비밀번호가 성공적으로 변경되었습니다.");
            navigate("/mypage");
        } catch (err) {
            setError("비밀번호 변경에 실패했습니다.");
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h2>비밀번호 변경</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}

            {step === "verify" ? (
                <>
                    <label>현재 비밀번호</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button onClick={handleVerify}>확인</button>
                </>
            ) : (
                <>
                    <label>새 비밀번호</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <label>새 비밀번호 확인</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button onClick={handleChangePassword}>비밀번호 변경</button>
                </>
            )}
        </div>
    );
};

export default PasswordChangePage;