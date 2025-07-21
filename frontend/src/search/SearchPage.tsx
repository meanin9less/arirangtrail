import React, {FormEvent, use, useEffect, useState} from "react";
import axios from "axios";
import './search.css'
import {Link} from "react-router-dom";

// 지역 코드 데이터를 위한 인터페이스
interface AreaInfo {
    name: string;
    code: string;
}

// API 검색 결과로 받아올 축제 하나하나의 모양을 정의합니다.
// CalendarPage의 MyFestival과 거의 동일하지만, 역할 분리를 위해 새로 정의할 수 있습니다.
interface SearchFestival {
    contentid: string;
    title: string;
    addr1: string;
    firstimage?: string; // 이미지는 없을 수 있으므로 선택적으로
}

// 지역 코드 데이터
const areaData: AreaInfo[] = [
    {name: '서울특별시', code: '1'},
    {name: '인천광역시', code: '2'},
    {name: '대전광역시', code: '3'},
    {name: '대구광역시', code: '4'},
    {name: '광주광역시', code: '5'},
    {name: '부산광역시', code: '6'},
    {name: '울산광역시', code: '7'},
    {name: '세종특별자치시', code: '8'},
    {name: '경기도', code: '31'},
    {name: '강원특별자치도', code: '32'},
    {name: '충청북도', code: '33'},
    {name: '충청남도', code: '34'},
    {name: '경상북도', code: '35'},
    {name: '경상남도', code: '36'},
    {name: '전북특별자치도', code: '37'},
    {name: '전라남도', code: '38'},
    {name: '제주특별자치도', code: '39'},
];

const SearchPage = () => {
    const [selectAreaCode, setSelectAreaCode] = useState<string>("1");
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [festivals, setFestivals] = useState<SearchFestival[]>([]);
    const [filterFestivals, setFilterFestivals] = useState<SearchFestival[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = ('0' + (today.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 +1, 두 자리로 맞춤
        const day = ('0' + today.getDate()).slice(-2); // 날짜를 두 자리로 맞춤
        return `${year}${month}${day}`;
    };

    // 지역 코드 바뀔때마다 호출
    useEffect(() => {
        const fetchFestivalsByArea = async () => {
            setIsLoading(true);
            setFestivals([]);
            setFilterFestivals([]);
            setSearchKeyword("");

            const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
            const API_URL =
                `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            const todayString = getTodayDateString(); // 오늘 날짜 (YYYYMMDD)

            try {
                const response = await axios.get(API_URL, {
                    params: {
                        numOfRows: 50, // 50개만 가져오도록 설정
                        pageNo: 1,
                        areaCode: selectAreaCode, // 사용자가 선택한 지역 코드로 검색
                        eventStartDate: todayString,
                        arrange: 'B',
                    }
                });
                console.log(response.data);
                const items = response.data.response.body.items?.item || [];
                setFestivals(items);
                setFilterFestivals(items);
            } catch (e) {
                console.error("지역별 검색 실패:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFestivalsByArea();
    }, [selectAreaCode]);

    useEffect(() => {
        if (searchKeyword.trim() === "") {
            // 키워드가 비어있으면, 필터링된 목록을 원본 목록 전체로 되돌림
            setFilterFestivals(festivals);
        } else {
            const filtered = festivals.filter(festival =>
                festival.title.toLowerCase().includes(searchKeyword.toLowerCase()));
            setFilterFestivals(filtered);
        }
    }, [searchKeyword, festivals]);

    return (
        <div className="search-page-container">
            <h1 className="search-title">축제 검색</h1>
            <div className="search-controls">
                <select
                    className="search-select-area"
                    value={selectAreaCode}
                    onChange={(e) => setSelectAreaCode(e.target.value)}
                >
                    {areaData.map(area => (
                        <option key={area.code} value={area.code}>{area.name}</option>
                    ))}
                </select>
                <input
                    type="text"
                    className="search-input-keyword"
                    placeholder="키워드를 입력해주세요.(예: 불꽃, 시장)"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    disabled={isLoading} // 로딩 중에는 입력 비활성화
                />
            </div>

            {/* --- 검색 결과 표시: 이제 filteredFestivals를 사용합니다 --- */}
            <div className="search-results-container">
                {isLoading && <div className="loading-indicator">새로운 지역의 축제를 불러오는 중...</div>}

                {!isLoading && filterFestivals.length === 0 && (
                    <div className="no-results-message">표시할 축제가 없습니다.</div>
                )}

                {!isLoading && filterFestivals.length > 0 && (
                    <ul className="festival-search-list">
                        {filterFestivals.map(festival => (
                            <li key={festival.contentid} className="festival-search-item">
                                <Link to={`/calender/${festival.contentid}`} className="festival-search-link">
                                    <img
                                        src={festival.firstimage || 'https://via.placeholder.com/120x90.png?text=No+Image'}
                                        alt={festival.title}
                                        className="festival-search-image"
                                    />
                                    <div className="festival-search-info">
                                        <h3 className="festival-search-title">{festival.title}</h3>
                                        <p className="festival-search-address">{festival.addr1}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SearchPage;