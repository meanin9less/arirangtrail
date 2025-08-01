import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './LikedFestivalsPage.module.css'; // 새로 생성한 스타일 파일 임포트
import { IoLocationOutline } from 'react-icons/io5'; // 아이콘 임포트

// 한국관광공사 API 응답 (detailCommon2) 인터페이스
interface KTOFestivalDetail {
    contentid: string;
    contenttypeid: string;
    title: string;
    addr1: string;
    addr2: string;
    firstimage: string; // 이미지 URL은 있지만 목록에서는 사용하지 않음
    firstimage2: string;
    tel: string;
    overview?: string;
    homepage?: string;
    eventstartdate?: string; // searchFestival2에서 오는 필드
    eventenddate?: string;   // searchFestival2에서 오는 필드
}

// 백엔드에서 찜한 목록을 가져올 때의 인터페이스
// 백엔드 FestivalService.getLikedFestivalsByUser()가 Set<String>을 반환하므로,
// 여기서는 List<string>으로 받아서 처리합니다.
interface LikedItem {
    contentId: string; // Set<String>의 각 요소가 contentId이므로, 이 인터페이스는 단순화될 수 있습니다.
}


// 한국관광공사 API 서비스 키 (CalendarPage에서 가져옴)
const SERVICE_KEY = "D%2BNvbQO6awBrrWwItvgBA9pGA1QRcHz3RIgcboswo74yK2VW1omMg95mNyvjfzH91o%2BM3SydfBdHCrdGtPaNrQ%3D%3D";
const KTO_API_BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

// 찜한 축제/관광지 아이템 컴포넌트 (간결화)
interface LikedFestivalItemProps {
    festival: KTOFestivalDetail;
    onItemClick: (contentId: string) => void;
}

const LikedFestivalItem: React.FC<LikedFestivalItemProps> = ({ festival, onItemClick }) => {
    return (
        <div className={styles.festivalItem} onClick={() => onItemClick(festival.contentid)}>
            <Link to={`/calender/${festival.contentid}`} className={styles.festivalTitleLink} onClick={(e) => e.stopPropagation()}>
                {festival.title}
            </Link>
            <span className={styles.festivalMeta}>
                <IoLocationOutline className="inline-block mr-1" />
                {`${festival.addr1 || ''} ${festival.addr2 || ''}`.trim() || '주소 정보 없음'}
            </span>
        </div>
    );
};

const LikedFestivalsPage: React.FC = () => {
    const navigate = useNavigate();
    const jwtToken = useSelector((state: RootState) => state.token.token);
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

            // 1. 백엔드에서 사용자가 찜한 contentId 목록을 가져옵니다.
            // ✨ API 경로 최종 수정: '/festivals/likes/my'로 변경
            const likedResponse = await apiClient.get<string[]>('/festivals/likes/my', {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            });
            // 백엔드 FestivalService.getLikedFestivalsByUser()가 Set<String>을 반환하므로,
            // Axios는 이를 배열(string[])로 받습니다.
            const likedContentIds = likedResponse.data;

            if (likedContentIds.length === 0) {
                setLikedFestivals([]);
                setLoading(false);
                return;
            }

            // 2. 각 contentId에 대해 한국관광공사 API에서 상세 정보를 가져옵니다.
            const festivalDetailsPromises = likedContentIds.map(async (contentId) => {
                const detailApiUrl = `${KTO_API_BASE_URL}/detailCommon2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
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
                            <LikedFestivalItem festival={festival} onItemClick={handleItemClick} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LikedFestivalsPage;
