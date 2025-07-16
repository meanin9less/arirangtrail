import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import apiClient from '../api/axiosInstance'; // API 통신을 위한 axios 인스턴스 (주석 처리)
// import axios from 'axios'; // axios 에러 처리를 위해 필요 (주석 처리)

// ----------------------------------------------------------------------------------
// 1. ✨ 재료의 모양 정의 (Interface = 설계도/레시피의 '재료 준비물' 목록)
// ----------------------------------------------------------------------------------

// 회원가입 폼에서 받을 데이터들의 '모양'과 '자료형'을 미리 약속해둡니다.
// 이 약속 덕분에 나중에 실수하면 타입스크립트가 바로 알려줍니다.
interface JoinFormData {
    userId: string;       // 아이디는 문자열
    password: string;     // 비밀번호도 문자열
    email: string;        // 이메일도 문자열
    firstName: string;    // 성도 문자열
    lastName: string;     // 이름도 문자열
    dateOfBirth: string;  // 생년월일은 'YYYY-MM-DD' 형식의 문자열
}

// 서버로부터 받을 응답 메시지의 모양 (예측)
interface JoinResponse {
    message: string;      // 응답에는 'message'라는 문자열이 있을 거야.
}

// ----------------------------------------------------------------------------------
// 2. ✨ 회원가입 페이지 컴포넌트 시작 (실제 요리를 시작하는 주방)
// ----------------------------------------------------------------------------------

function JoinPage() {
    // 페이지 이동을 도와주는 도우미 (react-router-dom 제공)
    const navigate = useNavigate();

    // ----------------------------------------------------------------------------
    // 3. ✨ 요리 재료 상태 관리 (useState = 요리 중인 재료의 현재 상태를 기록하는 메모)
    // ----------------------------------------------------------------------------

    // [1] 회원가입 폼의 모든 입력 값을 한 번에 관리하는 상태
    // useState<JoinFormData>는 이 'formData'가 위에서 정의한 'JoinFormData' 설계도대로 생겼음을 알려줍니다.
    // 초기값은 모든 필드를 빈 문자열로 설정한 객체입니다.
    const [formData, setFormData] = useState<JoinFormData>({
        userId: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
    });

    // [2] 사용자에게 보여줄 메시지 (예: "회원가입 성공!", "아이디 중복")를 관리하는 상태
    // 초기값은 'null'이므로, 처음에는 아무 메시지도 보이지 않습니다.
    const [message, setMessage] = useState<string | null>(null);

    // [3] API 호출이 진행 중인지 (로딩 중인지) 여부를 관리하는 상태
    // 초기값은 'false'이므로, 처음에는 로딩 중이 아닙니다.
    const [loading, setLoading] = useState<boolean>(false);

    // ----------------------------------------------------------------------------
    //  ✨ 스타일 박스 모음 (const ???: React.CSSProperties = {})
    // ----------------------------------------------------------------------------

    const InputSBoxStyle: React.CSSProperties = {width: '90%', padding: '8px'};

    // ----------------------------------------------------------------------------
    // 4. ✨ 입력 필드 값 변경 핸들러 (handleChange = 재료 양을 조절하는 손)
    // ----------------------------------------------------------------------------

    // 이 함수는 모든 입력 필드(<input>)의 값이 변경될 때마다 호출됩니다.
    // 'e: ChangeEvent<HTMLInputElement>'는 이 이벤트가 HTML 입력 요소에서 발생했음을 알려줍니다.
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // 이벤트가 발생한 입력 필드의 'name' 속성 (예: "userId", "password")과 'value' (입력된 값)를 가져옵니다.
        const { name, value } = e.target;

        // formData 상태를 업데이트합니다.
        setFormData(prevData => ({
            ...prevData, // 기존의 formData 객체를 그대로 복사하고 (나머지 필드는 유지)
            [name]: value // 'name'에 해당하는 필드만 새로운 'value'로 업데이트합니다.
            // 예: name이 "userId"면 { ...기존, userId: "새로운값" }
        }));
    };

    // ----------------------------------------------------------------------------
    // 5. ✨ 폼 제출 핸들러 (handleSubmit = 요리를 완성하고 제출하는 과정)
    // ----------------------------------------------------------------------------

    // 폼이 제출될 때 (회원가입 버튼 클릭 등) 호출되는 함수입니다.
    // 'e: FormEvent<HTMLFormElement>'는 폼 제출 이벤트임을 알려줍니다.
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // ✨ 중요: 브라우저의 기본 폼 제출 동작(페이지 새로고침)을 막습니다.

        setMessage(null); // 새로운 회원가입 시도를 위해 이전 메시지를 지웁니다.
        setLoading(true); // API 호출이 시작되었으니 로딩 상태를 'true'로 설정합니다.

        console.log('회원가입 데이터:', formData); // 개발용: 현재 폼에 입력된 데이터를 콘솔에 출력하여 확인합니다.

        try {
            // ✨ 실제 API 호출이 이루어질 부분입니다. (현재는 주석 처리되어 임시 로직으로 대체됨)
            // const response = await apiClient.post<JoinResponse>('/join', formData);
            // setMessage(response.data.message || '회원가입 성공!');

            // 임시 성공 시뮬레이션 (API 호출 대신 1.5초 기다리는 척 합니다)
            await new Promise(resolve => setTimeout(resolve, 1500));

            setMessage('회원가입 성공!'); // 성공 메시지 설정
            alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.'); // 사용자에게 알림
            navigate('/login'); // 로그인 페이지로 이동

        } catch (error: any) { // API 호출 중 에러가 발생하면 이곳으로 옵니다.
            console.error('회원가입 오류:', error); // 콘솔에 에러 상세 정보 출력
            // axios.isAxiosError(error) && error.response ? error.response.data?.message : '...'
            // 위 코드는 axios 에러인 경우 서버 응답에서 에러 메시지를 가져오는 로직입니다.
            setMessage('회원가입 실패: 오류가 발생했습니다.'); // 사용자에게 실패 메시지 설정

        } finally { // try 또는 catch 블록이 끝나면 무조건 실행됩니다.
            setLoading(false); // API 호출이 끝났으니 로딩 상태를 'false'로 돌립니다.
        }
    };

    // ----------------------------------------------------------------------------
    // 6. ✨ 화면에 보여줄 내용 (return = 완성된 요리를 접시에 담아 내놓기)
    // ----------------------------------------------------------------------------

    return (
        // 전체 폼을 감싸는 div (스타일링 목적)
        <div style={{ padding: '20px', border: '4px solid #ccc', borderRadius: '5px', maxWidth: '450px', margin: '50px auto' }}>
            <h2>회원가입</h2>

            {/* 'message' 상태에 값이 있을 때만 메시지 문단을 보여줍니다. (조건부 렌더링) */}
            {message && (
                <p style={{ color: message.includes('성공') ? 'green' : 'red', fontWeight: 'bold' }}>
                    {message}
                </p>
            )}

            {/* 폼 시작: 제출 시 handleSubmit 함수 호출 */}
            <form onSubmit={handleSubmit}>
                {/* 폼 항목들: 아이디, 비밀번호, 이메일, 성, 이름, 생년월일 */}
                {/* 각 div는 하나의 입력 필드를 감쌉니다. */}
                <div style={{ marginBottom: '10px' }}>
                    {/* label과 input의 id를 연결하여 접근성을 높입니다. */}
                    <label htmlFor="userId" style={{ display: 'block', marginBottom: '5px' }}>아이디:</label>
                    <input
                        type="text"      // 텍스트 입력 필드
                        id="userId"      // label과 연결
                        name="userId"    // handleChange 함수가 이 필드를 식별하는 이름
                        value={formData.userId} // ✨ 현재 formData 상태의 'userId' 값과 연결 (Controlled Component)
                        onChange={handleChange} // ✨ 입력 값이 바뀔 때마다 handleChange 호출
                        required         // 이 필드는 필수로 입력해야 함
                        style={InputSBoxStyle} // 간단한 스타일
                    />
                </div>

                {/* 나머지 입력 필드들도 위와 동일한 방식으로 구성됩니다. */}
                {/* type="password"는 입력 시 글자가 *로 표시됩니다. */}
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>비밀번호:</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                {/* type="email"은 이메일 형식 유효성 검사 힌트를 제공합니다. */}
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

                {/* type="date"는 날짜 선택 UI를 제공합니다. */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="dateOfBirth" style={{ display: 'block', marginBottom: '5px' }}>생년월일:</label>
                    <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required style={InputSBoxStyle} />
                </div>

                {/* 회원가입 제출 버튼 */}
                <button
                    type="submit" // 폼 제출 버튼
                    disabled={loading} // ✨ 'loading' 상태가 true면 버튼 비활성화 (여러 번 클릭 방지)
                    style={{
                        width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white',
                        border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '회원가입 중...' : '회원가입'} {/* ✨ 'loading' 상태에 따라 버튼 텍스트 변경 */}
                </button>
            </form>

            {/* 이미 계정이 있다면 로그인 페이지로 이동하는 링크 */}
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>
                    이미 계정이 있으신가요? 로그인
                </Link>
            </p>
        </div>
    );
}

export default JoinPage; // 이 컴포넌트를 다른 파일에서 가져다 쓸 수 있도록 내보냅니다.