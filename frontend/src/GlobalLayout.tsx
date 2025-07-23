import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from './navigation/NavigationBar';
import WebSocketManager from './WebSocketManager'; // 방금 만든 로직 컴포넌트
import Footer from './footer/Footer';
import TranslateWidget from "./TranslateWiget";


function GlobalLayout() {
    return (
        <>
            {/* 1.이 컴포넌트는 화면에 보이지 않지만, 웹소켓 연결을 관리합니다. */}
            <WebSocketManager />

            {/* 2.여기부터는 화면에 보이는 공통 UI 입니다. */}
            <TranslateWidget />
            <NavigationBar />

            {/* <Outlet /> 위치에 자식 페이지 컴포넌트가 렌더링됩니다. */}
            <main>
                <Outlet />
            </main>
            {/* ✨ 푸터도 항상 여기에 렌더링 됩니다. */}
            <Footer />
        </>
    );
}

export default GlobalLayout;