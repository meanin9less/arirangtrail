import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

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

// 한국관광공사 API 서비스 키
const SERVICE_KEY = "D%2BNvbQO6awBrrWwItvgBA9pGA1QRcHz3RIcGbOsWO74yK2VW1omMg95mNyvjfzH91o%2BM3SydBdBdHCrdGtPaNrQ%3D%3D"; // 가상의 서비스 키
const KTO_API_BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

// 찜한 축제/관광지 아이템 컴포넌트
interface LikedFestivalItemProps {
    festival: KTOFestivalDetail;
    onItemClick: (contentId: string) => void;
    onUnlike: (contentId: string) => void;
}

const LikedFestivalItem: React.FC<LikedFestivalItemProps> = ({ festival, onItemClick, onUnlike }) => {
    return (
        <div className="festivalItem">
            <div className="festivalDetails" onClick={() => onItemClick(festival.contentid)}>
                {/* `useNavigate` 대신 일반 <a> 태그를 사용하여 클릭 이동을 처리 */}
                <a href={`/calender/${festival.contentid}`} className="festivalTitleLink" onClick={(e) => e.stopPropagation()}>
                    {festival.title}
                </a>
            </div>
            {/* onUnlike 함수는 실제 백엔드 연동이 필요합니다. 여기서는 기능만 구현 */}
            <button className="unlikeButton" onClick={() => onUnlike(festival.contentid)}>찜 해제</button>
        </div>
    );
};

const LikedFestivalsPage: React.FC = () => {
    // `useNavigate` 대신 `window.location.href` 사용
    const navigate = (path: string) => {
        window.location.href = path;
    };

    // Redux 대신 테스트용 토큰 및 로그인 상태 사용
    const jwtToken = "mock_jwt_token_for_api_call";
    const isLoggedIn = !!jwtToken;

    const [likedFestivals, setLikedFestivals] = useState<KTOFestivalDetail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLikedFestivals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!isLoggedIn) {
                // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
                navigate('/login');
                return;
            }

            // 1. 백엔드에서 사용자가 찜한 contentId 목록을 가져옵니다.
            const likedResponse = await axios.get<string[]>('/festivals/likes/my', {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            });
            const likedContentIds = likedResponse.data;

            if (likedContentIds.length === 0) {
                setLikedFestivals([]);
                setLoading(false);
                return;
            }

            // 2. 각 contentId에 대해 한국관광공사 API에서 상세 정보를 가져옵니다.
            const festivalDetailsPromises = likedContentIds.map(async (contentId) => {
                const detailApiUrl = `${KTO_API_BASE_URL}/detailCommon2`;
                try {
                    const detailResponse = await axios.get(detailApiUrl, {
                        params: {
                            serviceKey: SERVICE_KEY,
                            MobileApp: 'AppTest',
                            MobileOS: 'ETC',
                            _type: 'json',
                            contentId: contentId,
                            defaultYN: 'Y', // 다시 한번 정확히 'Y'로 설정
                            firstImageYN: 'Y',
                            areacodeYN: 'Y',
                            catcodeYN: 'Y',
                            addrinfoYN: 'Y',
                            mapinfoYN: 'Y',
                            overviewYN: 'Y',
                        },
                    });

                    const item = detailResponse.data?.response?.body?.items?.item;
                    if (item) {
                        return Array.isArray(item) ? item[0] : item;
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
    }, [isLoggedIn, jwtToken]);

    useEffect(() => {
        fetchLikedFestivals();
    }, [fetchLikedFestivals]);

    // 아이템 클릭 시 상세 페이지로 이동
    const handleItemClick = (contentId: string) => {
        navigate(`/calender/${contentId}`);
    };

    // 찜 해제 기능 (예시)
    const handleUnlike = (contentId: string) => {
        // 실제로는 백엔드 API를 호출하여 찜 해제 처리를 해야 합니다.
        console.log(`${contentId} 찜 해제 요청`);
        // UI에서 해당 아이템 제거
        setLikedFestivals(prev => prev.filter(festival => festival.contentid !== contentId));
    };

    if (loading) {
        return (
            <div className="container">
                <p className="message">찜한 축제를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <p className={`message errorMessage`}>{error}</p>
            </div>
        );
    }

    return (
        <>
            {/* 사용자가 제공한 CSS를 <style> 태그 내부에 직접 삽입 */}
            <style>
                {`
                .container {
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    background-color: #fff;
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                }
                
                .pageTitle {
                    text-align: center;
                    color: #333;
                    margin-bottom: 30px;
                    font-size: 2em;
                    font-weight: bold;
                }
                
                .message {
                    text-align: center;
                    color: #666;
                    margin-bottom: 10px;
                }
                
                .errorMessage {
                    color: red;
                    font-weight: bold;
                    text-align: center;
                    margin-top: 5px;
                }
                
                .backButton {
                    display: block;
                    width: fit-content;
                    margin: 0 auto 20px auto;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 1em;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .backButton:hover {
                    background-color: #0056b3;
                }
                
                .noContentMessage {
                    text-align: center;
                    color: #666;
                    padding: 40px 0;
                    font-size: 1.1em;
                }
                
                /* --- 찜 목록 아이템 스타일 (간소화) --- */
                .festivalList {
                    list-style-type: none;
                    padding: 0;
                    margin: 0;
                }
                
                .festivalItem {
                    display: flex;
                    justify-content: space-between; /* 제목과 버튼을 양 끝으로 정렬 */
                    align-items: center; /* 세로 중앙 정렬 */
                    border: 1px solid #eee;
                    border-radius: 6px;
                    padding: 12px 15px;
                    background-color: #fcfcfc;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    cursor: pointer; /* 전체 아이템 클릭 가능하도록 */
                    transition: background-color 0.2s ease, transform 0.2s ease;
                }
                
                .festivalItem:hover {
                    background-color: #f0f8ff; /* 호버 시 배경색 변경 */
                    transform: translateY(-2px); /* 약간 위로 올라가는 효과 */
                }
                
                .festivalDetails {
                    flex-grow: 1; /* 제목이 남은 공간을 차지하도록 */
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .festivalTitleLink {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: #333;
                    text-decoration: none;
                    white-space: nowrap; /* 줄바꿈 방지 */
                    overflow: hidden; /* 넘치는 텍스트 숨김 */
                    text-overflow: ellipsis; /* 넘치는 텍스트 ... 처리 */
                    margin-right: 15px; /* 제목과 버튼 사이 간격 */
                }
                
                .festivalTitleLink:hover {
                    color: #007bff;
                    text-decoration: underline;
                }
                
                .unlikeButton {
                    background-color: #dc3545; /* 빨간색 */
                    color: white;
                    padding: 6px 12px;
                    border: none;
                    border-radius: 5px;
                    font-size: 0.85em;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    flex-shrink: 0; /* 버튼이 줄어들지 않도록 */
                }
                
                .unlikeButton:hover {
                    background-color: #c82333;
                }
                
                /* 모바일 반응형 */
                @media (max-width: 768px) {
                    .container {
                        margin: 20px auto;
                        padding: 20px;
                    }
                
                    .pageTitle {
                        font-size: 1.8em;
                    }
                
                    .backButton {
                        padding: 8px 15px;
                        font-size: 0.9em;
                    }
                
                    .festivalItem {
                        flex-direction: column; /* 모바일에서는 세로로 쌓이도록 */
                        align-items: flex-start; /* 왼쪽 정렬 */
                        padding: 10px;
                    }
                
                    .festivalDetails {
                        width: 100%;
                        margin-bottom: 10px; /* 제목 아래 여백 */
                    }
                
                    .festivalTitleLink {
                        width: 100%;
                        margin-right: 0;
                        margin-bottom: 5px;
                    }
                
                    .unlikeButton {
                        width: 100%; /* 버튼 너비 꽉 채우기 */
                        text-align: center;
                        padding: 8px; /* 버튼 패딩 조정 */
                    }
                }
                `}
            </style>
            <div className="container">
                <h2 className="pageTitle">찜한 축제/관광지</h2>
                <button onClick={() => navigate('/mypage')} className="backButton">
                    마이페이지로 돌아가기
                </button>
                {likedFestivals.length === 0 ? (
                    <p className="noContentMessage">아직 찜한 축제/관광지가 없습니다.</p>
                ) : (
                    <ul className="festivalList">
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
        </>
    );
};

export default LikedFestivalsPage;
