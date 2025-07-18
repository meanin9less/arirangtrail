import React, {useEffect, useMemo, useState} from "react";

// FullCalendar 라이브러리에서 리액트용 달력 부품과 확장 기능들
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {DateClickArg} from "@fullcalendar/interaction";
import {DatesSetArg} from "@fullcalendar/core";
import axios from "axios";
import "./calender.css"
import {useNavigate} from "react-router-dom";

// 외부용 설계도: API 응답으로 오는 item 객체 하나의 모양
interface ApiFestival {
    title: string;
    addr1: string;
    addr2: string;
    contenttypeid: string;
    contentid: string;
    eventstartdate: string;
    eventenddate: string;
    firstimage: string;
    firstimage2: string;
    tel: string;
}

// 내부용 설계도: 우리 앱에서 다루기 쉽게 변환한 최종 데이터 모양
interface MyFestival {
    title: string;
    location: string;
    addr1: string;
    addr2: string;
    id: string;
    startdate: string;
    enddate: string;
    image?: string; // ?는 선택적 속성, ?가 없는데 이미지가 없으면 오류남
    image2?: string;
    tel?: string;
}

//  Date 날짜 객체를 YYYY-MM-DD 형태의 문자열로 변환
const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 월(0~11)을 가져와 +1 하고, 두 자리로 만듬.
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 특정 년도와 월의 마지막 날짜를 계산해주는 함수
const getLastDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate(); // 다음 달의 0번째 날은 이번 달의 마지막 날과 같다.
};

// 메인 켈린더 페이지 컴포넌트
const CalendarPage = () => {
    const [festivals, setFestivals] = useState<MyFestival[]>([]); // API를 통해 받아온 실제 축제 데이터들을 저장
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<string>("views"); // 'views', 'name', 'ending'
    const navigate = useNavigate();

    // 외부 API 데이터 가져오기
    useEffect(() => {
        const fetchFestivals = async () => {
            const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
            const API_URL =
                `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            try {
                const lastDay = getLastDayOfMonth(currentYear, currentMonth);
                const startDateString = `${currentYear}${currentMonth.toString().padStart(2, "0")}01`;
                const endDateString = `${currentYear}${currentMonth.toString().padStart(2, "0")}${lastDay.toString().padStart(2, '0')}`;

                // API에 데이터 요청
                const response = await axios.get(API_URL, {
                    params: { // 요청 파라미터
                        numOfRows: 50,
                        pageNo: 1,
                        arrange: "B", // 조회순
                        eventStartDate: startDateString,
                        eventEndDate: endDateString,
                    },
                });
                console.log("서버로부터 받은 전체 데이터:", response.data);

                // API 응답에서 실제 축제 목록 추출 (없을 경우 빈 배열)
                const festivalListFromApi = response.data.response.body.items.item || [];

                // 받아온 API 데이터를 MyFestival 형태로 변환
                const transformedFestivals: MyFestival[] = festivalListFromApi.map(
                    (item: ApiFestival) => {
                        return {
                            id: item.contentid,
                            title: item.title,
                            addr1: item.addr1,
                            addr2: item.addr2,
                            location: `${item.addr1} ${item.addr2}`.trim(),
                            startdate: `${item.eventstartdate.substring(0, 4)}-${item.eventstartdate.substring(4, 6)}-${item.eventstartdate.substring(6, 8)}`,
                            enddate: `${item.eventenddate.substring(0, 4)}-${item.eventenddate.substring(4, 6)}-${item.eventenddate.substring(6, 8)}`,
                            image: item.firstimage,
                            image2: item.firstimage2,
                            tel: item.tel,
                        };
                    }
                );
                setFestivals(transformedFestivals);
            } catch (err) {
                console.error("API 호출 중 에러 발생:", err);
            } finally {
                setIsLoading(false); // 요청이 성공하든 실패하든 로딩 상태를 false로 변경
            }
        };
        fetchFestivals();
    }, [currentYear, currentMonth]);

    // 날짜별로 몇 개의 축제가 진행 중인지 개수를 계산합니다.
    const festivalCountsByDate = useMemo(() => {
        const counts: { [date: string]: number } = {};  // '날짜: 개수' 형태의 객체를 생성
        festivals.forEach((festival) => { // 모든 축제를 순회하면서
            let currentDate = new Date(festival.startdate); // 시작일부터
            const finalDate = new Date(festival.enddate); // 종료일까지
            while (currentDate <= finalDate) { // 하루씩 반복하며
                const dateStr = toYYYYMMDD(currentDate); // 날짜를 'YYYY-MM-DD' 문자열로 바꾸고
                counts[dateStr] = (counts[dateStr] || 0) + 1; // 해당 날짜의 카운트를 1 증가
                currentDate.setDate(currentDate.getDate() + 1); // 다음 날로 이동
            }
        });
        return counts; // 최종 계산된 객체를 반환
    }, [festivals]);

    // 선택된 날짜의 축제 목록을 필터링하고 정렬
    const festivalsForSelectedDate = useMemo(() => {
        if (!selectedDate) return []; // 선택된 날짜가 없으면 빈 배열을 반환

        // 전체 축제 목록에서 선택된 날짜에 해당하는 축제만 선별
        const filtered = festivals.filter((festival) => {
            const startDate = new Date(festival.startdate);
            const endDate = new Date(festival.enddate);
            const sDate = new Date(selectedDate);
            return sDate >= startDate && sDate <= endDate;
        });

        // 정렬 로직 적용
        switch (sortOrder) {
            case 'name': // 이름순
                return filtered.sort((a, b) => a.title.localeCompare(b.title));
            case 'ending': // 마감임박순
                return filtered.sort((a, b) => new Date(a.enddate).getTime() - new Date(b.enddate).getTime());
            case 'views': // 조회순(기본값)
            default: // 그 외의 경우
                return filtered; // API에서 받은 순서(조회순) 그대로 사용
        }
    }, [selectedDate, festivals, sortOrder]); // 의존성 배열에 sortOrder 추가

    // 달력의 날짜를 클릭했을 때 실행되는 함수
    const handleDateClick = (clickInfo: DateClickArg) => {
        setSelectedDate((prev) => // 이전 선택 값과 비교하여
            prev === clickInfo.dateStr ? null : clickInfo.dateStr // 같은 날짜를 또 클릭하면 선택 해제(null), 다른 날짜면 선택
        );
    };

    // 달력의 '이전/다음' 버튼을 눌러 월이 바뀔 때 실행되는 함수
    const handleDatesSet = (dateInfo: DatesSetArg) => {
        const newDate = dateInfo.view.currentStart; // 새로 표시되는 달의 첫 날짜를 가져옴
        setCurrentYear(newDate.getFullYear()); // '연도' 상태를 업데이트
        setCurrentMonth(newDate.getMonth() + 1);  // '월' 상태를 업데이트
    };

    // 상세 페이지로 이동하는 함수
    const handleEventClick = (festivalId: string) => {
        navigate(`/calender/${festivalId}`);
    };

    return (
        <div className="festival-calendar-container">
            {isLoading && (
                <div className="loading-overlay">
                    <span>Loading data</span>
                </div>
            )}
            <div className="custom-header">
                <div className="header-title">월별 축제 달력</div>
            </div>
            <FullCalendar // FullCalendar 라이브러리의 메인 컴포넌트
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth" // 달력의 기본 보기 형식을 '월별'로 설정
                headerToolbar={{
                    left: "prev",
                    center: "title",
                    right: "next"
                }}
                dateClick={handleDateClick} // 달력의 날짜를 클릭했을 때, 위에서 만든 handleDateClick 함수를 실행
                datesSet={handleDatesSet} // 달력의 월이 바뀌었을 때, 위에서 만든 handleDatesSet 함수를 실행
                dayCellContent={(arg) => { // 달력의 각 날짜 칸 의 내용 꾸미는 기능
                    const dateStr = toYYYYMMDD(arg.date); // 해당 칸의 날짜를 YYYY-MM-DD 형식으로 바꿈
                    const count = festivalCountsByDate[dateStr] || 0; // 위에서 계산한 축제 개수 객체에서 해당 날짜의 개수를 가져옴
                    return (
                        <div className="day-content-wrapper">
                            <div className="day-number">
                                {arg.dayNumberText.replace("일", "")}
                            </div>
                            {count > 0 && ( // 만약 축제 개수가 1개 이상일 때만 아래 내용을 보여줌
                                <div className="day-event-info"> {/* 축제 정보(개수)를 표시하는 영역입니다. */}
                                    <span className="day-event-count">{count} count</span>
                                </div>
                            )}
                        </div>
                    );
                }}
                // "selected-date"라는 CSS 클래스를 붙여서 선택된 날짜처럼 보이게 해주는 역할
                dayCellClassNames={(arg) => {
                    return toYYYYMMDD(arg.date) === selectedDate ? 'selected-date' : '';
                }}
            />
            {selectedDate && ( // selectedDate 클릭했을 때만 화면 출력
                <div className="festival-list-container">
                    <h3 className={"festivals-list-title"}>{selectedDate}의 축제 목록</h3>
                    <div className={"sort-buttons-container"}>
                        <button
                            className={`sort-button ${sortOrder === 'views' ? 'active' : ''}`}
                            onClick={() => setSortOrder('views')}
                        >
                            조회순
                        </button>
                        <button
                            className={`sort-button ${sortOrder === 'name' ? 'active' : ''}`}
                            onClick={() => setSortOrder('name')}
                        >
                            이름순
                        </button>
                        <button
                            className={`sort-button ${sortOrder === 'ending' ? 'active' : ''}`}
                            onClick={() => setSortOrder('ending')}
                        >
                            마감임박순
                        </button>
                    </div>

                    {festivalsForSelectedDate.length > 0 ? (
                        <ul>
                            {festivalsForSelectedDate.map(festival => (
                                <li key={festival.id} onClick={() => handleEventClick(festival.id)}
                                    className="festival-item">
                                    {festival.image && (
                                        <img
                                            src={festival.image}
                                            alt={festival.title}
                                            className="festival-image"
                                        />
                                    )}
                                    <div className="festival-details">
                                        <strong>{festival.title}</strong>
                                        <p>({festival.location})</p>
                                        <p>({festival.startdate}~{festival.enddate})</p>
                                    </div>

                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>해당 날짜에 진행 중인 축제가 없습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CalendarPage;

