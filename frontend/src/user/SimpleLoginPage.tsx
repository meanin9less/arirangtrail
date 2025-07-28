import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserProfile, setToken } from '../store';

const SimpleLoginPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { userData, accessToken } = location.state || {};

    useEffect(() => {
        if (userData && accessToken) {
            dispatch(setUserProfile(userData));
            dispatch(setToken(accessToken));
            // 저장 후 메인 페이지로 이동
            navigate('/');
        } else {
            navigate('/login'); // 데이터 없으면 로그인으로
        }
    }, [userData, accessToken, dispatch, navigate]);

    return <div>자동 로그인 처리 중...</div>;
};

export default SimpleLoginPage;