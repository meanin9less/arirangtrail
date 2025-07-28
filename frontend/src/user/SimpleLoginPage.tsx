import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserProfile, setToken } from '../store';
import apiClient from "../api/axiosInstance";

const SimpleLoginPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { userData, accessToken } = location.state || {};

    useEffect(() => {
        const reissue = async () =>{
            try {
                const response = await apiClient.get("/reissue");
                if (response.status===200){
                    const access = response.headers["Authorization"];
                    dispatch(setToken(access));
                    const res = await apiClient.get("/userinfo",{
                        headers:{
                            Authorization:access
                        }
                    });
                    if (res.status===200){
                        const userProfileData = {
                            username: res.data.username,
                            nickname: res.data.nickname,
                            imageUrl: res.data.imageUrl || 'https://placehold.co/50x50/cccccc/ffffff?text=User'
                        };
                        dispatch(setUserProfile(userProfileData));
                        navigate("/");
                    }
                }
            }catch (err: any) {
                console.error('가입 실패:', err);
                if (err.response) {
                    console.error('Response status:', err.response.status);
                    console.error('Response data:', err.response.data);
                } else if (err.request) {
                    console.error('No response received:', err.request);
                } else {
                    console.error('Error', err.message);
                }
            }
        }
        reissue();
    }, [userData, accessToken, dispatch, navigate]);

    return <div>자동 로그인 처리 중...</div>;
};

export default SimpleLoginPage;