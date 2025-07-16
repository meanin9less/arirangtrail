import React from 'react';
import {Link} from "react-router-dom"; // React 라이브러리를 가져옵니다.

// Login 컴포넌트가 받을 props는 지금은 없으므로, 비어있는 인터페이스를 만듭니다.
// 이렇게 하면 TypeScript에게 "나는 외부에서 특별히 받을 데이터(props)가 없어"라고 알려주는 거예요.
interface LoginProps {
    // 현재는 아무 props도 받지 않습니다.
}

// Login 함수형 컴포넌트를 정의합니다.
// {}: LoginProps 부분은 "아무 props도 받지 않지만, 만약 받는다면 LoginProps 규칙을 따를 거야"라는 의미예요.
const LoginPage = ({}: LoginProps) => {
    return (
        <div>
            <h2>로그인</h2>
            <form>
                <div>
                    <label htmlFor="username">아이디:</label>
                    <input type="text" id="username" placeholder="아이디를 입력하세요" />
                </div>
                <div>
                    <label htmlFor="password">비밀번호:</label>
                    <input type="password" id="password" placeholder="비밀번호를 입력하세요" />
                </div>
                <button type="submit">로그인</button>
            </form>
            <Link to={'/signup'}>
                <button style={{marginTop: '10px'}}>회원가입</button> {/* 간단한 여백 추가 */}
            </Link>

        </div>
    );
};

export default LoginPage; // 다른 파일에서 이 Login 컴포넌트를 사용할 수 있도록 내보냅니다.