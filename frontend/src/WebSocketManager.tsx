import React, {useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import store, {clearAuth, RootState, setExpiresIn, setToken, setTotalUnreadCount, updateLobby} from "./store";
import apiClient from "./api/axiosInstance";
// 나중에 만들 Redux action들을 임포트한다고 가정
// import { updateLobby, updateUnreadCount } from './store';

function WebSocketManager() {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const dispatch = useDispatch();
    const clientRef = useRef<Client | null>(null);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const token = useSelector((state:RootState)=>state.token.token);
    const expiresIn = useSelector((state:RootState)=>state.token.expiresIn);

    // 2. 토큰을 재발급하는 함수 (useCallback으로 최적화)
    const refreshToken = useCallback(async () => {
        console.log("⏰ [AuthManager] Access Token 갱신을 시도합니다...");
        try {
            const response = await apiClient.post('/reissue');

            const newAccessToken = response.headers['authorization'];
            const newExpiresIn = response.data.expiresIn;

            if (newAccessToken && newExpiresIn) {
                console.log("✅ [AuthManager] Access Token 갱신 성공!");
                // ✨ Redux 스토어를 새 정보로 업데이트 (두 단계로 나누어 호출)
                dispatch(setToken(newAccessToken));
                dispatch(setExpiresIn(newExpiresIn));
            } else {
                throw new Error("New access token or expiresIn not found in reissue response.");
            }
        } catch (error) {
            console.error("❌ [AuthManager] 토큰 갱신 실패:", error);
            dispatch(clearAuth()); // 재발급 실패 시 로그아웃
        }
    }, [dispatch]);

    // 토큰 자동 재발급 타이머 설정 useEffect
    useEffect(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        if (token && expiresIn) {
            const delay = (expiresIn * 1000) - 60000; // 만료 1분 전

            if (delay > 0) {
                console.log(`[AuthManager] 다음 토큰 갱신까지 남은 시간: ${delay / 1000}초`);
                refreshTimerRef.current = setTimeout(refreshToken, delay);
            } else {
                refreshToken();
            }
        }

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [token, expiresIn, refreshToken]);


    useEffect(() => {
        const token = store.getState().token.token;
        if (!userName || !token) {
            return;
        }

        if (!userName) {
            // 로그아웃 상태이면 기존 연결을 끊고 종료
            if (clientRef.current) {
                clientRef.current.deactivate();
                clientRef.current = null;
            }
            return;
        }

        if (clientRef.current) {
            // 이미 연결되어 있다면 중복 연결 방지
            return;
        }

        const client = new Client({
            connectHeaders: {
                // ★★★ 여기에 Authorization 헤더를 추가합니다. ★★★
                Authorization: `${store.getState().token.token}`, // Redux에서 토큰 가져오기
            },
            webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_URL}/ws-stomp`),
            reconnectDelay: 10000,
            onConnect: () => {
                console.log('✅ 전역 웹소켓 연결 성공!');
                clientRef.current = client;

                //1. 로비 대상자
                client.subscribe('/sub/chat/lobby', (message) => {
                    console.log('로비 업데이트 수신:', message.body);
                    dispatch(updateLobby());
                });

                //2. 각 개인 유저 대상
                client.subscribe(`/sub/user/${userName}`, (message) => {
                    const notification = JSON.parse(message.body);
                    console.log('개인 알림 수신:', message.body);
                    // ✅ 서버가 보낸 'TOTAL_UNREAD_COUNT_UPDATE' 메시지를 처리
                    if (notification.type === 'TOTAL_UNREAD_COUNT_UPDATE') {
                        // Redux 스토어의 총 안 읽은 메시지 개수를 즉시 업데이트
                        dispatch(setTotalUnreadCount(notification.totalUnreadCount));
                    }

                    // 강퇴 메시지 처리 등 다른 알림 처리...
                    if (notification.type === 'KICK') {
                        // ...
                    }
                });
            },
            onDisconnect: () => {
                console.log('🔴 전역 웹소켓 연결 종료.');
                clientRef.current = null;
            }
        });

        client.activate();

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [userName, dispatch]);

    // 이 컴포넌트는 화면에 아무것도 렌더링하지 않습니다.
    return null;
}

export default WebSocketManager;