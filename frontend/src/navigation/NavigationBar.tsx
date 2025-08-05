import React, {useState, useEffect, useRef} from 'react';
import {Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch, clearAuth} from '../store';

import navStyles from './NavigationBar.module.css';
import homeStyles from '../homepage/HomePage.module.css';

import arirangTrailIcon from '../images/arirang1.png';
import personIcon from '../images/person.png';

const defaultProfileIcon = 'https://placehold.co/30x30/cccccc/ffffff?text=U';

const NavigationBar = () => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;
    const totalUnreadCount = useSelector((state: RootState) => state.token.totalUnreadCount);

    const userProfile = useSelector((state: RootState) => state.token.userProfile);

    const profilePictureUrl = userProfile?.imageurl;
    const username = userProfile?.username;

    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    //  현재 경로를 확인하는 로직
    const location = useLocation();
    // 홈페이지('/')인지 확인
    const isHomePage = location.pathname === '/';

    // 경로에 따라 다른 스타일을 사용
    const appliedStyles = isHomePage ? homeStyles : navStyles;
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
        // clearAuth 액션을 디스패치하여 토큰과 프로필 정보를 모두 초기화
        dispatch(clearAuth());
        localStorage.removeItem('jwtToken'); // 로컬 스토리지에서도 제거
        setShowUserDropdown(false); // 드롭다운 닫기
        navigate('/logout');
    };

    // 표시할 닉네임 (Redux 스토어에서 가져오거나 기본값 사용)
    const displayNickname = username || '사용자';

    // 최종 프로필 이미지 URL
    const finalProfileImageUrl = profilePictureUrl || defaultProfileIcon;


    return (
        <>
            <nav className={navClassName}>
                {/* 좌측 그룹: 홈 아이콘 적용 (아리랑 트레일 로고 사용) */}
                <div className={appliedStyles.navGroupLeft}>
                    <Link to={"/"} className={appliedStyles.homeLink}>
                        {/* 아리랑 트레일 로고 이미지 사용 및 arirangicon 클래스 적용 */}
                        <img src={arirangTrailIcon} alt="홈 아이콘" className={appliedStyles.arirangicon}/>
                    </Link>
                </div>

                {/* 중앙 그룹: 기존 링크들 */}
                <div className={appliedStyles.navGroupCenter}>
                    <Link to="/calender" className={appliedStyles.navLink}>캘린더</Link>
                    <Link to="/search" className={appliedStyles.navLink}>지역검색</Link>
                    <Link to="/review" className={appliedStyles.navLink}>축제후기</Link>
                    <Link to="/community" className={appliedStyles.navLink}>커뮤니티</Link>
                    <Link to="/company" className={appliedStyles.navLink}>회사소개</Link>
                </div>

                {/* 우측: 로그인 or 사용자 메뉴 */}
                <div className={appliedStyles.navGroupRight} ref={dropdownRef}>
                    {isLoggedIn ? (
                        // 로그인 상태일 때: 프로필 이미지와 닉네임이 있는 드롭다운 버튼
                        <div className={appliedStyles.userMenuContainer}>
                            <Link to={"/community/my-rooms"} className={appliedStyles.communityLinkContainer}>
                                나의 채팅기록
                                {/* 안 읽은 메시지가 1개 이상일 때만 뱃지를 표시합니다. */}
                                {totalUnreadCount > 0 && (
                                    <span className={appliedStyles.unreadBadge}>새로운 메세지 {totalUnreadCount}</span>
                                )}
                            </Link>
                            <button
                                className={appliedStyles.userProfileButton}
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                            >
                                {/* ⭐ Redux 스토어에서 가져온 URL 사용 */}
                                <img
                                    src={finalProfileImageUrl}
                                    alt="프로필"
                                    className={appliedStyles.profileImageSmall}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = defaultProfileIcon;
                                    }}
                                />
                            </button>
                            {showUserDropdown && (
                                // 드롭다운 메뉴
                                <div className={appliedStyles.userDropdownMenu}>
                                    <Link to="/mypage" className={appliedStyles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                                        마이페이지
                                    </Link>
                                    <button onClick={handleLogout} className={appliedStyles.dropdownItem}>
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className={appliedStyles.loginLinkTextOnly}>
                            <img src={personIcon} alt="로그인 아이콘" className={appliedStyles.icon} />
                        </Link>
                    )}
                </div>
            </nav>
            {/*<Outlet />*/}
        </>
    );
}

export default NavigationBar;
