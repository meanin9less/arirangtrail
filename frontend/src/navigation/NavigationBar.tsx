import React, {useState, useEffect, useRef} from 'react';
import {Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch, clearAuth} from '../store'; // clearAuth 임포트
import styles from './NavigationBar.module.css';

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
    const totalUnreadCount = useSelector((state: RootState) => state.token.totalUnreadCount);

    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    //  ️현재 경로를 확인하는 로직
    const location = useLocation();
    // 홈페이지('/')인지 확인
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
        // clearAuth 액션을 디스패치하여 토큰과 프로필 정보를 모두 초기화
        dispatch(clearAuth());
        localStorage.removeItem('jwtToken'); // 로컬 스토리지에서도 제거
        setShowUserDropdown(false); // 드롭다운 닫기
        navigate('/logout');
    };

    // 프로필 이미지 URL 결정 (userProfile에서 가져오거나 기본값 사용)
    const profileImageUrl = userProfile?.imageurl || defaultProfileIcon;
    // 표시할 닉네임 (userProfile에서 가져오거나 사용자명, 없으면 '사용자')
    const displayNickname = userProfile?.nickname || userProfile?.username || '사용자';

    return (
        <>
            <nav className={navClassName}>
                {/* 좌측 그룹: 홈 아이콘 적용 (아리랑 트레일 로고 사용) */}
                <div className={styles.navGroupLeft}>
                    <Link to={"/"} className={styles.homeLink}>
                        {/* 아리랑 트레일 로고 이미지 사용 및 arirangicon 클래스 적용 */}
                        <img src={arirangTrailIcon} alt="홈 아이콘" className={styles.arirangicon}/>
                        {/* 홈 텍스트는 필요에 따라 추가/제거 */}
                        {/* <span className={styles.linkText}>홈</span> */}
                    </Link>
                </div>

                {/* 중앙 그룹: 기존 링크들 */}
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
                        // 로그인 상태일 때: 프로필 이미지와 닉네임이 있는 드롭다운 버튼
                        <div className={styles.userMenuContainer}>
                            {/* --- ✨ 여기가 새로 추가된 부분입니다 --- */}
                            {/* 커뮤니티 링크를 감싸는 컨테이너를 하나 만들어서, 뱃지를 위치시킵니다. */}
                            <Link to={"/community/my-rooms"} className={styles.communityLinkContainer}>
                                나의 채팅기록
                                {/* 안 읽은 메시지가 1개 이상일 때만 뱃지를 표시합니다. */}
                                {totalUnreadCount > 0 && (
                                    <span className={styles.unreadBadge}>새로운 메세지 {totalUnreadCount}</span>
                                )}
                            </Link>
                            <button
                                className={styles.userProfileButton}
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                            >
                                {/* 프로필 이미지 (또는 플레이스홀더) */}
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
                                // 드롭다운 메뉴
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
            {/*<Outlet />*/}
        </>
    );
}

export default NavigationBar;
