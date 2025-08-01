import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import styles from './LikedFestivalsPage.module.css';

// 한국관광공사 API 응답 (detailCommon2) 인터페이스
type MyLikedFestivalDTO = {
    contentid: string;
    title: string;
    firstimage: string;
};


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
    festival: MyLikedFestivalDTO; // 타입을 백엔드 DTO와 일치시킴
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
    const [likedFestivals, setLikedFestivals] = useState<MyLikedFestivalDTO[]>([]);
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

                // ✨ 1. 백엔드 API를 한 번만 호출하면 모든 정보가 다 들어있습니다! ✨
                const response = await apiClient.get<MyLikedFestivalDTO[]>(
                    `/festivals/likes/my-list`,
                    {
                        // 인터셉터가 헤더를 넣어주므로 여기서는 params만 신경쓰면 됩니다.
                        params: { username: userProfile.username },
                    }
                );

                // ✨ 2. 외부 API를 또 호출할 필요 없이, 백엔드가 준 데이터를 그대로 상태에 저장합니다. ✨
                setLikedFestivals(response.data);

            } catch (err) {
                console.error("찜 목록을 불러오는 중 오류가 발생했습니다:", err);
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    setError("인증에 실패했습니다. 다시 로그인해주세요.");
                } else {
                    setError("찜 목록을 불러오는 중 오류가 발생했습니다.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLikedFestivals();
    }, [isLoggedIn, userProfile?.username]);

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
