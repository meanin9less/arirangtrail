import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './LikedFestivalsPage.module.css';
import { IoLocationOutline, IoCalendarOutline } from 'react-icons/io5';

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
    firstimage: string; // 이미지 URL
    firstimage2: string;
    tel: string;
    overview?: string;
    homepage?: string;
    // KTO API에서 직접 제공되지 않는 필드들은 백엔드에서 함께 저장하지 않는 한 여기서는 사용하지 않습니다.
    // 예: eventstartdate, eventenddate
}

// 찜한 축제/관광지 아이템 컴포넌트
interface LikedFestivalItemProps {
    festival: KTOFestivalDetail; // KTO API에서 가져온 상세 정보
    onUnlike: (contentId: string, festivalName: string) => void; // 찜 해제 핸들러
}

const LikedFestivalItem: React.FC<LikedFestivalItemProps> = ({ festival, onUnlike }) => {
    return (
        <div className={styles.festivalItem}>
            {/* 이미지가 있다면 표시, 없으면 플레이스홀더 */}
            <img
                src={festival.firstimage || 'https://placehold.co/100x100/cccccc/ffffff?text=No Image'}
                alt={festival.title}
                className={styles.festivalImage}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://placehold.co/100x100/cccccc/ffffff?text=No Image';
                }}
            />
            <div className={styles.festivalDetails}>
                <Link to={`/calender/${festival.contentid}`} className={styles.festivalTitleLink}>
                    {festival.title}
                </Link>
                <p className={styles.festivalMeta}>
                    <IoLocationOutline className="inline-block mr-1" />
                    {`${festival.addr1 || ''} ${festival.addr2 || ''}`.trim() || '주소 정보 없음'}
                </p>
                {/* 찜한 날짜는 KTO API에서 제공하지 않으므로, 백엔드에서 LikedFestivalDTO를 사용해야 합니다.
                    현재 FestivalController는 contentId만 반환하므로, 이 필드는 주석 처리합니다.
                    만약 찜한 날짜를 표시하려면 백엔드 FestivalService.getLikedFestivalsByUser()가
                    LikedFestivalDTO와 유사한 객체 리스트를 반환하도록 변경되어야 합니다.
                <p className={styles.likedDate}>찜한 날짜: {new Date(festival.likedDate).toLocaleDateString()}</p>
                */}
                <button
                    onClick={(e) => { e.stopPropagation(); onUnlike(festival.contentid, festival.title); }}
                    className={styles.unlikeButton}
                >
                    찜 해제
                </button>
            </div>
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
            // ✨ API 경로 수정: '/api' 중복 제거 및 백엔드 경로와 정확히 일치하도록 수정
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
            // POST 요청으로 contentId와 username을 전달하여 찜 상태를 토글
            // ✨ API 경로 수정: '/api' 중복 제거
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
