import React, {useEffect, useState} from "react";
import axios from "axios";
import {Link} from "react-router-dom";

// 지역 코드 데이터를 위한 인터페이스
interface AreaInfo {
    name: string;
    code: string;
}


// API 검색 결과로 받아올 축제 하나하나의 모양을 정의합니다.
// CalendarPage의 MyFestival과 거의 동일하지만, 역할 분리를 위해 새로 정의할 수 있습니다.
interface SearchedFestival {
    contentid: string;
    title: string;
    addr1: string;
    firstimage?: string; // 이미지는 없을 수 있으므로 선택적으로
}

// 지역 코드 데이터
const areaData: AreaInfo[] = [
    {name: '서울', code: '1'},
    {name: '인천', code: '2'},
    {name: '대전', code: '3'},
    {name: '대구', code: '4'},
    {name: '광주', code: '5'},
    {name: '부산', code: '6'},
    {name: '울산', code: '7'},
    {name: '세종', code: '8'},
];

const SearchPage = () => {
    const [searchFestivals, setSearchFestivals] = useState<SearchedFestival[]>([]);
    const [selectAreaCode, setSelectAreaCode] = useState("1"); // 기본값 서울

    useEffect(() => {
        const searchAreaCode = async () => {
            const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
            const API_URL =
                `https://apis.data.go.kr/B551011/KorService2/areaCode2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        numOfRows: 50, // 50개만 가져오도록 설정
                        pageNo: 1,
                        arrange: 'B', // 인기순(조회순)으로 정렬
                        areaCode: selectAreaCode, // 사용자가 선택한 지역 코드로 검색
                    }
                });
                setSearchFestivals(response.data.response.body.items.item || []);
            } catch (e) {
                console.error("지역별 검색 실패:", e);
            }
        };
        if (selectAreaCode) {
            searchAreaCode();
        }
    }, [selectAreaCode]);

    return (
        <div style={{padding: '20px', maxWidth: '800px', margin: 'auto'}}>
            <h2>지역별 축제 검색</h2>
            <div className="area-buttons" style={{marginBottom: '20px'}}>
                {areaData.map(area => (
                    <button
                        key={area.code}
                        onClick={() => setSelectAreaCode(area.code)}
                        style={{
                            padding: '8px 12px', marginRight: '10px',
                            backgroundColor: selectAreaCode === area.code ? '#8a2be2' : '#f0f0f0',
                            color: selectAreaCode === area.code ? 'white' : 'black',
                            border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer'
                        }}
                    >
                        {area.name}
                    </button>
                ))}
            </div>
            <ul>
                {searchFestivals.map(festival => (
                    <li key={festival.contentid} style={{marginBottom: '10px', listStyle: 'none'}}>
                        <Link to={`/calendar/${festival.contentid}`}>
                            {festival.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
};

export default SearchPage;