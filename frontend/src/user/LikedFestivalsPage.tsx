import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './LikedFestivalsPage.module.css';
import { IoLocationOutline } from 'react-icons/io5'; // 아이콘 임포트 (이제 사용하지 않지만, 필요시를 위해 남겨둠)

// 한국관광공사 API 서비스 키 (파일 최상단에 정의)
const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
const KTO_API_BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

// 한국관광공사 API 응답 (detailCommon2) 인터페이스
interface KTOFestivalDetail {
    contentid: string;
    contenttypeid: string;
    title: string;
    addr1: string;
    addr2: string;
    firstimage: string; // 이미지 URL (데이터는 가져오지만 UI에 표시하지 않음)
    firstimage2: string;
    tel: string;
    overview?: string;
    homepage?: string;
    eventstartdate?: string;
    eventenddate?: string;
}

// 찜한 축제/관광지 아이템 컴포넌트
interface LikedFestivalItemProps {
    festival: KTOFestivalDetail; // KTO API에서 가져온 상세 정보
    onUnlike: (contentId: string, festivalName: string) => void; // 찜 해제 핸들러
    onItemClick: (contentId: string) => void; // 아이템 클릭 핸들러 추가
}

const LikedFestivalItem: React.FC<LikedFestivalItemProps> = ({ festival, onUnlike, onItemClick }) => {
    return (
        // 전체 아이템을 클릭 가능하게 하고 상세 페이지로 이동
        <div className={styles.festivalItem} onClick={() => onItemClick(festival.contentid)}>
            <div className={styles.festivalDetails}>
                {/* 제목은 Link로 감싸서 실제 페이지 이동을 처리 */}
                <Link to={`/calender/${festival.contentid}`} className={styles.festivalTitleLink} onClick={(e) => e.stopPropagation()}>
                    {festival.title}
                </Link>
                {/* 찜한 날짜는 KTO API에서 제공하지 않으므로 주석 처리 */}
                {/* <p className={styles.likedDate}>찜한 날짜: {new Date(festival.likedDate).toLocaleDateString()}</p> */}
            </div>
            {/* 찜 해제 버튼은 그대로 유지 */}
            <button
                onClick={(e) => { e.stopPropagation(); onUnlike(festival.contentid, festival.title); }}
                className={styles.unlikeButton}
            >
                찜 해제
            </button>
        </div>
    );
};

const LikedFestivalsPage: React.FC = () => {
    const navigate = useNavigate();
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const userProfile = useSelector((state: RootState) => state.token.userProfile); // username 가져오기
    const isLoggedIn = !!jwtToken;

    const [likedFestivals, setLikedFestivals] = useState<KTOFestivalDetail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLikedFestivals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!isLoggedIn) {
                navigate('/login');
                return;
            }

            // 1. 백엔드 FestivalController에서 사용자가 찜한 contentId 목록을 가져옵니다.
            const likedResponse = await apiClient.get<string[]>('/festivals/my-page/likes', {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            });
            const likedContentIds = likedResponse.data; // Set<String>이 배열로 넘어옴

            if (likedContentIds.length === 0) {
                setLikedFestivals([]);
                setLoading(false);
                return;
            }

            // 2. 각 contentId에 대해 한국관광공사 API에서 상세 정보를 가져옵니다.
            const detailApiUrl = `${KTO_API_BASE_URL}/detailCommon2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            const festivalDetailsPromises = likedContentIds.map(async (contentId) => {
                try {
                    const detailResponse = await axios.get(detailApiUrl, {
                        params: {
                            contentId: contentId,
                            defaultYN: 'Y',
                            firstImageYN: 'Y',
                            areacodeYN: 'Y',
                            catcodeYN: 'Y',
                            addrinfoYN: 'Y',
                            mapinfoYN: 'Y',
                            overviewYN: 'Y',
                        },
                    });
                    const item = detailResponse.data?.response?.body?.items?.item;
                    if (item && item.length > 0) {
                        return item[0] as KTOFestivalDetail;
                    }
                    return null;
                } catch (detailErr) {
                    console.error(`KTO API 호출 오류 (contentId: ${contentId}):`, detailErr);
                    return null;
                }
            });

            const fetchedDetails = await Promise.all(festivalDetailsPromises);
            setLikedFestivals(fetchedDetails.filter(detail => detail !== null) as KTOFestivalDetail[]);

        } catch (err: any) {
            console.error('찜한 축제 불러오기 오류:', err);
            let errorMessage = '찜한 축제를 불러오는 데 실패했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, navigate, jwtToken]);

    useEffect(() => {
        fetchLikedFestivals();
    }, [fetchLikedFestivals]);

    // 아이템 클릭 시 상세 페이지로 이동
    const handleItemClick = (contentId: string) => {
        navigate(`/calender/${contentId}`);
    };

    // 찜 해제 핸들러
    const handleUnlike = async (contentId: string, festivalName: string) => {
        if (!userProfile?.username) {
            alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
            navigate('/login');
            return;
        }
        if (!window.confirm(`'${festivalName}'을(를) 찜 목록에서 삭제하시겠습니까?`)) {
            return;
        }
        try {
            // 백엔드에 찜 삭제 요청 (FestivalController의 toggleLike 엔드포인트 사용)
            await apiClient.post(`/festivals/${contentId}/like`, null, {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
                params: {
                    username: userProfile.username,
                },
            });
            // 성공 시 목록에서 해당 항목 제거 (UI 업데이트)
            setLikedFestivals(prev => prev.filter(f => f.contentid !== contentId));
            alert('찜 목록에서 삭제되었습니다.');
        } catch (err: any) {
            console.error('찜 삭제 오류:', err);
            let errorMessage = '찜 삭제에 실패했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <p className={styles.message}>찜한 축제를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <p className={`${styles.message} ${styles.errorMessage}`}>{error}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.pageTitle}>찜한 축제/관광지</h2>
            <button onClick={() => navigate('/mypage')} className={styles.backButton}>
                마이페이지로 돌아가기
            </button>
            {likedFestivals.length === 0 ? (
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
