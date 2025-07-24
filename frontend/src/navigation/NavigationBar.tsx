import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, clearAuth } from '../store';

import navStyles from './NavigationBar.module.css';
import homeStyles from '../homepage/HomePage.module.css';

import arirangTrailIcon from '../images/arirang1.png';
import personIcon from '../images/person.png';

const defaultProfileIcon = 'https://placehold.co/30x30/cccccc/ffffff?text=U';

const NavigationBar = () => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const isLoggedIn = !!jwtToken;
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const isHomePage = location.pathname === '/';

    // 경로에 따라 다른 스타일을 사용
    const styles = isHomePage ? homeStyles : navStyles;
    const navClassName = isHomePage ? homeStyles.navbar : navStyles.navbar;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(clearAuth());
        localStorage.removeItem('jwtToken');
        setShowUserDropdown(false);
        navigate('/logout');
    };

    const profileImageUrl = userProfile?.imageUrl || defaultProfileIcon;
    const displayNickname = userProfile?.nickname || userProfile?.username || '사용자';

    return (
        <>
            <nav className={navClassName}>
                {/* 좌측: 홈 로고 */}
                <div className={styles.navGroupLeft}>
                    <Link to="/" className={styles.homeLink}>
                        <img src={arirangTrailIcon} alt="홈 아이콘" className={styles.arirangicon} />
                    </Link>
                </div>

                {/* 중앙: 메뉴 링크들 */}
                <div className={styles.navGroupCenter}>
                    <Link to="/calender" className={styles.navLink}>캘린더</Link>
                    <Link to="/search" className={styles.navLink}>지역검색</Link>
                    <Link to="/review" className={styles.navLink}>축제후기</Link>
                    <Link to="/community" className={styles.navLink}>커뮤니티</Link>
                    <Link to="/company" className={styles.navLink}>회사소개</Link>
                </div>

                {/* 우측: 로그인 or 사용자 메뉴 */}
                <div className={styles.navGroupRight} ref={dropdownRef}>
                    {isLoggedIn ? (
                        <div className={styles.userMenuContainer}>
                            <button
                                className={styles.userProfileButton}
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                            >
                                <img
                                    src={profileImageUrl}
                                    alt="프로필"
                                    className={styles.profileImageSmall}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = defaultProfileIcon;
                                    }}
                                />
                            </button>
                            {showUserDropdown && (
                                <div className={styles.userDropdownMenu}>
                                    <Link to="/mypage" className={styles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                                        마이페이지
                                    </Link>
                                    <button onClick={handleLogout} className={styles.dropdownItem}>
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className={styles.loginLinkTextOnly}>
                            <img src={personIcon} alt="로그인 아이콘" className={styles.icon} />
                        </Link>
                    )}
                </div>
            </nav>

            <Outlet />
        </>
    );
};

export default NavigationBar;
