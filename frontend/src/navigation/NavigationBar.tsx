import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, setToken } from '../store';
import styles from './NavigationBar.module.css';

// ✨ 이미지 파일 임포트 경로 수정: src/images/ 에 있다고 가정합니다.
import homeIcon from '../images/home.png';
import personIcon from '../images/person.png'; // 로그인 아이콘으로 사용할 이미지

interface NaviProps {
    // 현재는 아무 props도 받지 않습니다.
}

const NavigationBar = ({}: NaviProps) => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;

    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        // 로컬 스토리지와 Redux Store 클리어는 LogoutPage에서 처리하도록 위임
        setShowUserDropdown(false); // 드롭다운 닫기
        navigate('/logout'); // /logout 경로로 이동하여 LogoutPage에서 실제 로그아웃 처리
    };

    return (
        <>
            <nav className={styles.navbar}>
                {/* 좌측 그룹: 홈 아이콘 적용 (텍스트 제거) */}
                <div className={styles.navGroupLeft}>
                    <Link to={"/"} className={styles.homeLink}>
                        <img src={homeIcon} alt="홈 아이콘" className={styles.icon}/> {/* 홈 아이콘 이미지 */}
                        {/* ✨ 홈 텍스트 제거: <span className={styles.linkText}>홈</span> */}
                    </Link>
                </div>

                {/* 중앙 그룹: 기존 링크들 */}
                <div className={styles.navGroupCenter}>
                    <Link to={"/calender"} className={styles.navLink}>캘린더</Link>
                    <Link to={"/search"} className={styles.navLink}>지역검색</Link>
                    <Link to={"/review"} className={styles.navLink}>축제후기</Link>
                    <Link to={"/community"} className={styles.navLink}>커뮤니티</Link>
                    <Link to={"/company"} className={styles.navLink}>회사소개</Link>
                </div>

                {/* 우측 그룹: 로그인/마이페이지 조건부 렌더링 */}
                <div className={styles.navGroupRight} ref={dropdownRef}>
                    {isLoggedIn ? (
                        // 로그인 상태일 때: 마이페이지 텍스트 버튼
                        <div className={styles.userMenuContainer}>
                            <button
                                className={styles.userTextButton}
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                            >
                                마이페이지
                            </button>
                            {showUserDropdown && (
                                // 드롭다운 메뉴
                                <div className={styles.userDropdownMenu}>
                                    <Link to={"/mypage"} className={styles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                                        마이페이지
                                    </Link>
                                    <button onClick={handleLogout} className={styles.dropdownItem}>
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // 로그아웃 상태일 때: 로그인 아이콘 링크 (텍스트 제거)
                        <Link to={"/login"} className={styles.loginLinkTextOnly}>
                            <img src={personIcon} alt="로그인 아이콘" className={styles.icon}/> {/* 로그인 아이콘 이미지 */}
                            {/* ✨ 로그인 텍스트 제거: <span className={styles.linkText}>로그인</span> */}
                        </Link>
                    )}
                </div>
            </nav>
            <Outlet />
        </>
    );
}

export default NavigationBar;
