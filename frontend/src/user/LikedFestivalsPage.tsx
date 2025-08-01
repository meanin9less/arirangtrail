import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LikedFestivalsPage.css'; // CSS 파일 import

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
        <div className="festivalItem">
            <div className="festivalDetails" onClick={() => onItemClick(festival.contentid)}>
                <span className="festivalTitleLink">{festival.title}</span>
            </div>
            <button className="unlikeButton" onClick={() => onUnlike(festival.contentid)}>찜 해제</button>
        </div>
    );
};

const LikedFestivalsPage: React.FC = () => {
    // useNavigate 대신 window.location.href 사용
    const navigate = (path: string) => {
        window.location.href = path;
    };

    const [likedFestivals, setLikedFestivals] = useState<KTOFestivalDetail[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 컴포넌트가 처음 렌더링될 때 찜 목록 데이터를 불러옵니다.
    useEffect(() => {
        // 이 부분에 실제 백엔드 API URL을 넣어주세요.
        const fetchLikedFestivals = async () => {
            try {
                // TODO: 여기에 찜 목록을 가져오는 실제 백엔드 API 호출 코드를 작성하세요.
                // TODO: 실제 백엔드 API를 호출하여 찜 목록(contentId 배열)을 가져오는 코드로 교체하세요.
                // const response = await axios.get('/api/liked-festivals');

                // 백엔드에서 찜한 콘텐츠 ID 목록을 받아오고,
                // 이 ID를 이용해 한국관광공사 API를 호출하는 로직을 추가해야 합니다.
                // 현재는 API가 없으므로 빈 목록으로 처리합니다.
                setLikedFestivals([]);
            } catch (err) {
                setError("찜 목록을 불러오는 중 오류가 발생했습니다.");
                console.error("API 호출 오류:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLikedFestivals();
    }, []);

    // 아이템 클릭 시 상세 페이지로 이동
    const handleItemClick = (contentId: string) => {
        navigate(`/calender/${contentId}`);
    };

    // 찜 해제 기능 (예시)
    const handleUnlike = async (contentId: string) => {
        try {
            // TODO: 여기에 찜 해제 백엔드 API 호출 코드를 작성하세요.
            // await axios.post('/api/unlike-festival', { contentId });

            // UI에서 해당 아이템 제거
            setLikedFestivals(prev => prev.filter(festival => festival.contentid !== contentId));
            console.log(`${contentId} 찜 해제 성공`);
        } catch (err) {
            console.error("찜 해제 오류:", err);
            setError("찜 해제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="container">
            <h2 className="pageTitle">찜한 축제/관광지</h2>
            <button onClick={() => navigate('/mypage')} className="backButton">
                마이페이지로 돌아가기
            </button>
            {isLoading ? (
                <p className="message">찜 목록을 불러오는 중...</p>
            ) : error ? (
                <p className="errorMessage">{error}</p>
            ) : likedFestivals.length === 0 ? (
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
    );
};

export default LikedFestivalsPage;
