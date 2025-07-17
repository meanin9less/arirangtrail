import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from "../api/axiosInstance";
import axios from 'axios';

// ----------------------------------------------------------------------------------
// 1. ✨ 재료의 모양 정의 (Interface = 설계도/레시피의 '재료 준비물' 목록)
// ----------------------------------------------------------------------------------

interface JoinFormData {
    userId: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
}

interface JoinResponse {
    message: string;
}

// ----------------------------------------------------------------------------------
// 2. ✨ 회원가입 페이지 컴포넌트 시작 (실제 요리를 시작하는 주방)
// ----------------------------------------------------------------------------------

function JoinPage() {
    const navigate = useNavigate();

    // ----------------------------------------------------------------------------
    // 3. ✨ 요리 재료 상태 관리 (useState = 요리 중인 재료의 현재 상태를 기록하는 메모)
    // ----------------------------------------------------------------------------

    const [formData, setFormData] = useState<JoinFormData>({
        userId: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
    });

    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    // ✨ 추가: 모달 표시 여부 상태
    const [showModal, setShowModal] = useState<boolean>(false);
    // ✨ 추가: 모달에 표시할 메시지 상태
    const [modalMessage, setModalMessage] = useState<string>('');

    // ----------------------------------------------------------------------------
    //  ✨ 스타일 박스 모음 (const ???: React.CSSProperties = {})
    // ----------------------------------------------------------------------------

    const InputSBoxStyle: React.CSSProperties = {width: '90%', padding: '8px'};

    // ----------------------------------------------------------------------------
    // 4. ✨ 입력 필드 값 변경 핸들러 (handleChange = 재료 양을 조절하는 손)
    // ----------------------------------------------------------------------------

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // ✨ 추가: 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        // 모달 닫기 후 로그인 페이지로 이동 (성공 시에만)
        if (message && message.includes('성공')) {
            navigate('/login');
        }
    };

    // ----------------------------------------------------------------------------
    // 5. ✨ 폼 제출 핸들러 (handleSubmit = 요리를 완성하고 제출하는 과정)
    // ----------------------------------------------------------------------------

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setMessage(null);
        setLoading(true);

        console.log('회원가입 데이터:', formData);

        try {
            // ✨ apiClient.post를 사용하여 실제 API 호출을 수행합니다.
            // baseURL은 apiClient에 이미 설정되어 있으므로 '/signup'으로 경로만 지정합니다.
            const response = await apiClient.post<JoinResponse>('/signup', formData);

            const successMessage = response.data.message || '회원가입 성공!';
            setMessage(successMessage);
            setModalMessage(successMessage + ' 로그인 페이지로 이동합니다.'); // 모달 메시지 설정
            setShowModal(true); // 모달 표시

        } catch (error: any) {
            console.error('회원가입 오류:', error);

            let errorMessage = '회원가입 실패: 네트워크 오류 또는 알 수 없는 오류가 발생했습니다.';
            if (axios.isAxiosError(error) && error.response) {
                // 서버에서 보낸 구체적인 오류 메시지가 있다면 사용
                errorMessage = error.response.data?.message || '회원가입 실패: 아이디 또는 비밀번호를 확인해주세요.';
            }
            setMessage(errorMessage);
            setModalMessage(errorMessage); // 모달 메시지 설정
            setShowModal(true); // 모달 표시

        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------------
    // 6. ✨ 화면에 보여줄 내용 (return = 완성된 요리를 접시에 담아 내놓기)
    // ----------------------------------------------------------------------------

    return (
        <div style={{ padding: '20px', border: '4px solid #ccc', borderRadius: '5px', maxWidth: '450px', margin: '50px auto' }}>
            <h2>회원가입</h2>

            {message && (
                <p style={{ color: message.includes('성공') ? 'green' : 'red', fontWeight: 'bold' }}>
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="userId" style={{ display: 'block', marginBottom: '5px' }}>아이디:</label>
                    <input
                        type="text"
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        required
                        style={InputSBoxStyle}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>비밀번호:</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>이메일:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="firstName" style={{ display: 'block', marginBottom: '5px' }}>성:</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="lastName" style={{ display: 'block', marginBottom: '5px' }}>이름:</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="dateOfBirth" style={{ display: 'block', marginBottom: '5px' }}>생년월일:</label>
                    <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white',
                        border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '회원가입 중...' : '회원가입'}
                </button>
            </form>

            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>
                    이미 계정이 있으신가요? 로그인
                </Link>
            </p>

            {/* ✨ 추가: 커스텀 모달 컴포넌트 */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)', maxWidth: '300px', textAlign: 'center'
                    }}>
                        <h3>알림</h3>
                        <p>{modalMessage}</p>
                        <button
                            onClick={handleCloseModal}
                            style={{
                                padding: '8px 15px', backgroundColor: '#007bff', color: 'white',
                                border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px'
                            }}
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
