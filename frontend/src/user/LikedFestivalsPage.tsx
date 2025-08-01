import React, { useState, useEffect } from 'react';
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
                // TODO: 실제 백엔드 API를 호출하여 찜 목록(contentId 배열)을 가져오는 코드로 교체하세요.
                // const response = await axios.get('/api/liked-festivals');
                // const likedContentIds = response.data.contentIds;
                //
                // 그리고 아래 목업(mock) 데이터 대신, 가져온 contentId를 바탕으로 한국관광공사 API를 호출하는 로직을 추가하면 됩니다.

                // 현재는 테스트를 위해 임시로 성공 응답을 시뮬레이션하는 데이터를 사용합니다.
                const mockResponse = {
                    data: [
                        {
                            contentid: "2781491",
                            contenttypeid: "15",
                            title: "보성다향대축제",
                            addr1: "전라남도 보성군 보성읍 녹차로 775",
                            addr2: "",
                            firstimage: "http://tong.visitkorea.or.kr/cms/resource/50/2781450_image2_1.jpg",
                            firstimage2: "http://tong.visitkorea.or.kr/cms/resource/50/2781450_image2_2.jpg",
                            tel: "061-852-6014",
                            overview: "보성다향대축제는 보성차밭에서 펼쳐지는 다양한 문화행사와 차 관련 체험을 즐길 수 있는 축제이다. 다례 시연, 찻잎 따기, 차 만들기 등 다채로운 프로그램이 마련되어 있다.",
                            homepage: "<a href=\"https://dianakorean.com\" target=\"_blank\" title=\"새창 : 보성다향대축제 홈페이지\">https://dianakorean.com</a>",
                            eventstartdate: "20240503",
                            eventenddate: "20240507"
                        },
                        {
                            contentid: "2825501",
                            contenttypeid: "15",
                            title: "진해군항제",
                            addr1: "경상남도 창원시 진해구 중원로터리 외 진해구 일대",
                            addr2: "",
                            firstimage: "http://tong.visitkorea.or.kr/cms/resource/97/2825597_image2_1.jpg",
                            firstimage2: "http://tong.visitkorea.or.kr/cms/resource/97/2825597_image2_2.jpg",
                            tel: "055-225-2342",
                            overview: "진해군항제는 세계 최대의 벚꽃축제로, 진해구 일대에 만개한 벚꽃을 감상하며 다양한 문화예술행사와 군악의장 페스티벌을 즐길 수 있다.",
                            homepage: "<a href=\"https://cherryblossom.changwon.go.kr\" target=\"_blank\" title=\"새창 : 진해군항제 홈페이지\">https://cherryblossom.changwon.go.kr</a>",
                            eventstartdate: "20240322",
                            eventenddate: "20240401"
                        }
                    ]
                };

                // API 응답 데이터로 상태 업데이트
                setLikedFestivals(mockResponse.data);
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
            // 이 부분에 실제 찜 해제 백엔드 API URL을 넣어주세요.
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
        </>
    );
};

export default LikedFestivalsPage;
