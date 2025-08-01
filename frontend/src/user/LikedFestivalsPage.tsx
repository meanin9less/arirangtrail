import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import styles from './LikedFestivalsPage.module.css';

// 한국관광공사 API 응답 (detailCommon2) 인터페이스
interface KTOFestivalDetail {
    contentid: string;
    contenttypeid: string;
    title: string;
    addr1: string;
    addr2: string;
    firstimage: string;
    firstimage2: string;
    tel: string;
    overview?: string;
    homepage?: string;
    eventstartdate?: string;
    eventenddate?: string;
}

// 찜한 축제/관광지 아이템 컴포넌트
interface LikedFestivalItemProps {
    festival: KTOFestivalDetail;
    onItemClick: (contentId: string) => void;
    onUnlike: (contentId: string) => void;
}

const LikedFestivalItem: React.FC<LikedFestivalItemProps> = ({ festival, onItemClick, onUnlike }) => {
    return (
        <div className={styles.festivalItem}>
            <div className={styles.festivalDetails} onClick={() => onItemClick(festival.contentid)}>
                {/* 썸네일 이미지가 있다면 표시, 없다면 기본 이미지 표시 */}
                <img
                    src={festival.firstimage || "https://placehold.co/80x80/cccccc/ffffff?text=No+Image"}
                    alt={festival.title}
                    className={styles.festivalImage}
                />
                <span className={styles.festivalTitleLink}>{festival.title}</span>
            </div>
            <button className={styles.unlikeButton} onClick={() => onUnlike(festival.contentid)}>찜 해제</button>
        </div>
    );
};

const LikedFestivalsPage: React.FC = () => {
    // 한국관광공사 API 키
    const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
    const navigate = useNavigate();

    // Redux store에서 사용자 정보 가져오기
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    // JWT 토큰과 사용자 프로필이 모두 있어야 로그인된 것으로 판단
    const isLoggedIn = !!jwtToken && !!userProfile?.username;

    // 찜한 축제 목록을 저장할 상태
    const [likedFestivals, setLikedFestivals] = useState<KTOFestivalDetail[]>([]);
    // 로딩 상태와 에러 상태
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 컴포넌트가 처음 렌더링될 때 또는 로그인/토큰 상태가 변경될 때 데이터를 불러옵니다.
    useEffect(() => {
        // 로그인이 되어있지 않으면 데이터 불러오기 중단
        if (!isLoggedIn) {
            setIsLoading(false);
            setError("로그인이 필요합니다.");
            return;
        }

        const fetchLikedFestivals = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // 1. 백엔드에서 사용자가 찜한 콘텐츠 ID 목록을 가져옵니다.
                // 백엔드 컨트롤러에 맞춰 API 경로를 '/api/festivals/likes/my'로 수정했습니다.
                // 이제 백엔드가 Principal을 통해 사용자를 식별하므로, username 쿼리 파라미터는 필요 없습니다.
                const likedListResponse = await apiClient.get<string[]>(`/festivals/likes/my`, {
                    headers: { Authorization: `Bearer ${jwtToken}` },
                });
                const likedContentIds = likedListResponse.data.map(id => Number(id));

                // 찜한 목록이 없으면 빈 배열로 상태 업데이트 후 종료
                if (likedContentIds.length === 0) {
                    setLikedFestivals([]);
                    setIsLoading(false);
                    return;
                }

                // 2. 찜한 ID들을 이용해 한국관광공사 API를 호출하여 상세 정보를 가져옵니다.
                // Promise.all을 사용하여 모든 API 요청을 병렬로 처리합니다.
                const fetchPromises = likedContentIds.map(id =>
                    axios.get(`https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`, {
                        params: {
                            numOfRows: 1,
                            pageNo: 1,
                            contentId: id,
                        }
                    })
                );

                const responses = await Promise.all(fetchPromises);
                const festivalDetails = responses.flatMap(response => {
                    const item = response.data.response.body.items.item;
                    // API 응답 구조를 확인하여 유효한 데이터만 필터링
                    return item ? [item[0]] : [];
                });

                setLikedFestivals(festivalDetails);
            } catch (err) {
                console.error("찜 목록을 불러오는 중 오류가 발생했습니다:", err);
                setError("찜 목록을 불러오는 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLikedFestivals();
    }, [isLoggedIn, jwtToken, userProfile]);

    // 아이템 클릭 시 상세 페이지로 이동하는 핸들러
    const handleItemClick = (contentId: string) => {
        // 상세 페이지 경로로 이동
        navigate(`/detail/${contentId}`);
    };

    // '찜 해제' 버튼 클릭 시 실행되는 핸들러
    const handleUnlike = async (contentId: string) => {
        if (!isLoggedIn) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            // 백엔드 API 호출하여 찜 해제 요청
            const contentIdNum = Number(contentId);
            // 백엔드 API 경로가 `/api/festivals/{contentid}/like`이므로 이전에 작성한 코드는 유효합니다.
            // 백엔드 컨트롤러에 명시된 대로 username을 쿼리 파라미터로 전달합니다.
            await apiClient.post(`/festivals/${contentIdNum}/like`, null, {
                headers: { Authorization: `Bearer ${jwtToken}` },
                params: { username: userProfile.username }
            });

            // UI에서 해당 아이템을 즉시 제거하여 사용자에게 피드백 제공
            setLikedFestivals(prev => prev.filter(festival => festival.contentid !== contentId));
            console.log(`${contentId} 찜 해제 성공`);
        } catch (err) {
            console.error("찜 해제 오류:", err);
            // 에러 발생 시 사용자에게 알림
            alert("찜 해제 중 오류가 발생했습니다.");
        }
    };

    // 로그인 여부에 따른 렌더링 분기
    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <h2 className={styles.pageTitle}>찜한 축제/관광지</h2>
                <p className={styles.message}>로그인이 필요합니다.</p>
                <button onClick={() => navigate('/mypage')} className={styles.backButton}>
                    마이페이지로 돌아가기
                </button>
            </div>
        );
    }

    // 로딩, 에러, 내용 유무에 따른 렌더링 분기
    return (
        <div className={styles.container}>
            <h2 className={styles.pageTitle}>찜한 축제/관광지</h2>
            <button onClick={() => navigate('/mypage')} className={styles.backButton}>
                마이페이지로 돌아가기
            </button>
            {isLoading ? (
                <p className={styles.message}>찜 목록을 불러오는 중...</p>
            ) : error ? (
                <p className={styles.errorMessage}>{error}</p>
            ) : likedFestivals.length === 0 ? (
                <p className={styles.noContentMessage}>아직 찜한 축제/관광지가 없습니다.</p>
            ) : (
                <ul className={styles.festivalList}>
                    {likedFestivals.map((festival) => (
                        <li key={festival.contentid}>
                            <LikedFestivalItem
                                festival={festival}
                                onItemClick={handleItemClick}
                                onUnlike={handleUnlike}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LikedFestivalsPage;
