import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {RootState} from "./store";
// 나중에 만들 Redux action들을 임포트한다고 가정
// import { updateLobby, updateUnreadCount } from './store';

function WebSocketManager() {
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const userName = userProfile?.username;
    const dispatch = useDispatch();
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
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
            webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_URL}/ws-stomp`),
            reconnectDelay: 10000,
            onConnect: () => {
                console.log('✅ 전역 웹소켓 연결 성공!');
                clientRef.current = client;

                client.subscribe('/sub/chat/lobby', (message) => {
                    console.log('로비 업데이트 수신:', message.body);
                    // TODO: Redux dispatch(updateLobby(message.body));
                });

                client.subscribe(`/sub/user/${userName}`, (message) => {
                    console.log('개인 알림 수신:', message.body);
                    // TODO: Redux dispatch(updateUnreadCount(JSON.parse(message.body)));
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