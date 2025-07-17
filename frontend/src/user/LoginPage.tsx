import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from "react-router-dom";
// ✨ 변경: axios 대신 우리가 만든 apiClient 인스턴스를 임포트합니다.
import apiClient from "../api/axiosInstance";
import axios from 'axios'; // axios.isAxiosError를 사용하기 위해 axios 자체도 임포트합니다.
// ✨ 추가: Redux useDispatch 훅을 임포트합니다.
import { useDispatch } from 'react-redux';
// ✨ 추가: Redux store에서 setToken 액션과 AppDispatch 타입을 임포트합니다.
import { setToken, AppDispatch } from '../store'; // '../store' 경로는 실제 store 파일 위치에 따라 조정해야 합니다.

// ----------------------------------------------------------------------------------
// 1. ✨ 재료의 모양 정의 (Interface = 설계도/레시피의 '재료 준비물' 목록)
// ----------------------------------------------------------------------------------

interface LoginProps {
    // 현재는 아무 props도 받지 않습니다.
}

interface LoginFormData {
    username: string;
    password: string;
}

// ✨ 추가: 로그인 API 응답의 모양을 정의합니다.
// 서버 응답에 따라 accessToken이 data 객체 안에 있거나, headers에 있을 수 있습니다.
interface LoginResponseData {
    message?: string; // 서버가 메시지를 보낼 수도 있음
    accessToken?: string; // 서버가 응답 본문에 토큰을 보낼 경우
    // 기타 필요한 응답 필드 추가
}

// ----------------------------------------------------------------------------------
// 2. ✨ 로그인 페이지 컴포넌트 시작 (실제 요리를 시작하는 주방)
// ----------------------------------------------------------------------------------

const LoginPage = ({}: LoginProps) => {

    const navigate = useNavigate();

    const dispatch: AppDispatch = useDispatch();

    // 로그인 데이터 상태변환
    const [formData, setFormData] = useState<LoginFormData>({
        username: '', // 초기 아이디 값은 빈 문자열
        password: '' // 초기 비밀번호 값은 빈 문자열
    });
    // 로그인 성공 여부 메시지
    const [message, setMessage] = useState<string | null>(null); // ✨ String 대신 string 사용 (TypeScript 기본 타입)
    // ✨ 추가: API 호출이 진행 중인지 (로딩 중인지) 여부를 관리하는 상태
    const [loading, setLoading] = useState<boolean>(false);
    // ✨ 추가: 모달 표시 여부 상태
    const [showModal, setShowModal] = useState<boolean>(false);
    // ✨ 추가: 모달에 표시할 메시지 상태
    const [modalMessage, setModalMessage] = useState<string>('');

    // 로그인 입력필드에 변화가 있을때마다
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
        const {name, value} = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    }

    // ✨ 추가: 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        // 모달 닫기 후 메인 페이지로 이동 (로그인 성공 시에만)
        if (message && message.includes('성공')) {
            navigate('/');
        }
    };

    // フォーム送信ハンドラー
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setMessage(null);
        setLoading(true); // 로딩 시작

        // 간단한 클라이언트 측 유효성 검사
        if (!formData.username || !formData.password) {
            setMessage('아이디와 비밀번호를 모두 입력해주세요.');
            setLoading(false); // 로딩 종료
            return;
        }

        try {
            // ✨ 변경: apiClient.post를 사용하여 서버에 POST 요청을 보냅니다.
            // 응답 타입을 LoginResponseData로 명시합니다.
            const response = await apiClient.post<LoginResponseData>('/login', formData); // 실제 API 엔드포인트로 변경하세요.

            const successMessage = response.data.message || '로그인 성공!';
            setMessage(successMessage);
            console.log('로그인 성공 응답:', response.data);

            // 10. 로그인 성공 후 처리 로직
            // 서버 설정에 따라 토큰이 headers에 있거나 data.accessToken에 있을 수 있습니다.
            const token = response.headers['authorization'] || response.data.accessToken;

            if (token) {
                localStorage.setItem('jwtToken', token);
                console.log('JWT 토큰 localStorage에 저장됨:', token);

                // ✨ 추가: Redux Store에 토큰을 저장합니다.
                dispatch(setToken(token));
                console.log('JWT 토큰 Redux Store에 저장됨.');

                setModalMessage(successMessage); // 모달 메시지 설정
                setShowModal(true); // 모달 표시

            } else {
                const noTokenMessage = '로그인 성공했지만 토큰을 받지 못했습니다.';
                setMessage(noTokenMessage);
                setModalMessage(noTokenMessage); // 모달 메시지 설정
                setShowModal(true); // 모달 표시
                console.warn('로그인 성공 응답에 토큰이 없습니다.');
            }

        } catch (error: any) {
            console.error('로그인 오류:', error);
            let errorMessage = '로그인 실패: 네트워크 오류 또는 알 수 없는 오류가 발생했습니다.';

            if (axios.isAxiosError(error) && error.response) {
                // 서버에서 보낸 구체적인 오류 메시지가 있다면 사용
                errorMessage = error.response.data?.message || '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.';
            }
            setMessage(errorMessage);
            setModalMessage(errorMessage); // 모달 메시지 설정
            setShowModal(true); // 모달 표시

        } finally {
            setLoading(false); // 로딩 종료
        }
    }

    return (
        <div>
            <h2>로그인</h2>
            {/* ✨ 추가: 로그인 성공/실패 메시지 표시 */}
            {message && (
                <p style={{ color: message.includes('성공') ? 'green' : 'red', fontWeight: 'bold' }}>
                    {message}
                </p>
            )}

            {/* ✨ 변경: 폼 제출 핸들러와 input 속성 추가 */}
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username">아이디:</label>
                    <input
                        type="text"
                        id="username"
                        name="username" // ✨ 추가: name 속성
                        value={formData.username} // ✨ 추가: value 속성
                        onChange={handleChange} // ✨ 추가: onChange 핸들러
                        placeholder="아이디를 입력하세요"
                        style={{width: '90%', padding: '8px'}} // 스타일 추가 (JoinPage와 통일)
                    />
                </div>
                <div style={{marginTop: '10px'}}> {/* 간격 추가 */}
                    <label htmlFor="password">비밀번호:</label>
                    <input
                        type="password"
                        id="password"
                        name="password" // ✨ 추가: name 속성
                        value={formData.password} // ✨ 추가: value 속성
                        onChange={handleChange} // ✨ 추가: onChange 핸들러
                        placeholder="비밀번호를 입력하세요"
                        style={{width: '90%', padding: '8px'}} // 스타일 추가
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading} // ✨ 'loading' 상태에 따라 버튼 비활성화
                    style={{
                        width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white',
                        border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer',
                        marginTop: '20px' // 간격 추가
                    }}
                >
                    {loading ? '로그인 중...' : '로그인'} {/* ✨ 'loading' 상태에 따라 버튼 텍스트 변경 */}
                </button>
            </form>

            <Link to={'/signup'}>
                <button
                    style={{
                        marginTop: '10px',
                        width: '100%', padding: '10px', backgroundColor: '#6c757d', color: 'white',
                        border: 'none', borderRadius: '5px', cursor: 'pointer'
                    }}
                >
                    회원가입
                </button>
            </Link>

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
};

export default LoginPage;
