import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, AppDispatch } from '../store'; // Redux store 및 setToken 액션 임포트

// LogoutPage 컴포넌트는 화면에 직접적으로 보여줄 UI가 없으므로 Props도 필요 없습니다.
interface LogoutPageProps {
    // 현재는 아무 props도 받지 않습니다.
}

const LogoutPage = ({}: LogoutPageProps) => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    // 컴포넌트가 마운트될 때 로그아웃 로직을 실행합니다.
    useEffect(() => {
        // 1. 로컬 스토리지에서 JWT 토큰 제거
        localStorage.removeItem('jwtToken');
        console.log('로컬 스토리지에서 JWT 토큰 제거됨.');

        // 2. Redux Store에서 토큰 상태 초기화 (null로 설정)
        dispatch(setToken(null));
        console.log('Redux Store에서 토큰 상태 초기화됨.');

        // 3. 로그아웃 처리 후 로그인 페이지 또는 홈 페이지로 리디렉션
        // 로그아웃 후에는 메인 페이지로 이동
        navigate('/');
        // 또는 navigate('/'); // 홈 페이지로 이동하고 싶다면 이 줄을 사용
    }, [dispatch, navigate]); // dispatch와 navigate는 변경되지 않으므로 의존성 배열에 포함해도 무방

    // 이 컴포넌트는 로그아웃 로직만 처리하고 UI를 렌더링하지 않으므로 null을 반환합니다.
    // 또는 "로그아웃 중..."과 같은 간단한 메시지를 잠시 보여줄 수도 있습니다.
    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>로그아웃 처리 중...</p>
        </div>
    );
};

export default LogoutPage;
