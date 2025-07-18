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
    const [searchFestivals, setSearchFestivals] = useState<SearchedFestival[]>([]);
    const [selectAreaCode, setSelectAreaCode] = useState("1"); // 기본값 서울
    const [detailInfo, setDetailInfo] = useState(null); // 상세 정보를 담을 변수

    useEffect(() => {
        const searchAreaFestivals = async () => {
            const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
            const API_URL =
                `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        numOfRows: 50, // 50개만 가져오도록 설정
                        pageNo: 1,
                        areaCode: selectAreaCode, // 사용자가 선택한 지역 코드로 검색
                        contentTypeId: 15,
                    }
                });
                console.log(response.data);
                setSearchFestivals(response.data.response.body.items.item || []);
            } catch (e) {
                console.error("지역별 검색 실패:", e);
            }
        };
        if (selectAreaCode) {
            searchAreaFestivals();
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
                        {festival.firstimage && (
                            <img
                                src={festival.firstimage}
                                alt={festival.title}
                                className="festival-image"
                            />
                        )}
                        {festival.title}
                    </li>
                ))}
            </ul>
        </div>
    )
};

export default SearchPage;