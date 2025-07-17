import React from 'react';
import { Link, Outlet } from "react-router-dom";
// ✨ CSS 모듈 임포트: 같은 디렉토리에 NavigationBar.module.css 파일을 생성해야 합니다.
import styles from './NavigationBar.module.css';


interface NaviProps {
    // 현재는 아무 props도 받지 않습니다.
}

const NavigationBar = ({}: NaviProps) => {

    return (
        <>
            {/* ✨ nav 태그에 클래스 적용 및 기본 스타일 유지 */}
            <nav className={styles.navbar}>
                {/* ✨ 좌측 그룹: 홈 */}
                <div className={styles.navGroupLeft}>
                    <Link to={"/"} className={styles.homeLink}>
                        홈
                    </Link>
                </div>

                {/* ✨ 중앙 그룹: 캘린더, 지역검색, 축제후기, 커뮤니티, 회사소개 */}
                <div className={styles.navGroupCenter}>
                    <Link to={"/calender"} className={styles.navLink}>캘린더</Link>
                    <Link to={"/search"} className={styles.navLink}>지역검색</Link>
                    <Link to={"/review"} className={styles.navLink}>축제후기</Link>
                    <Link to={"/community"} className={styles.navLink}>커뮤니티</Link>
                    <Link to={"/company"} className={styles.navLink}>회사소개</Link>
                </div>

                {/* ✨ 우측 그룹: 로그인 */}
                <div className={styles.navGroupRight}>
                    <Link to={"/login"} className={styles.loginLink}>
                        로그인
                    </Link>
                </div>
            </nav>
            {/* 내비게이션 바 아래에 자식 라우트 컴포넌트들이 렌더링될 위치 */}
            <Outlet />
        </>
    );
}

export default NavigationBar;
