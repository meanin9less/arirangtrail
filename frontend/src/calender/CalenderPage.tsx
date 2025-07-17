import React, {useState, useEffect, useMemo} from "react";

// FullCalendar 라이브러리에서 리액트용 달력 부품과 확장 기능들
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {DateClickArg} from "@fullcalendar/interaction";

import axios from "axios";
import "../css/calendar.css"
import {useNavigate} from "react-router-dom";

// 외부용 설계도: API 응답의 'item' 객체 하나의 모양
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

// 내부용 설계도: 우리 앱에서 사용할 최종 데이터의 모양
interface MyFestival {
    title: string;
    location: string;
    addr1: string;
    addr2: string;
    id: string;
    startdate: string;
    enddate: string;
    image?: string; // ?선택적 속성
    image2?: string;
    tel?: string;
}

// new Date()로 만들어진 날짜 객체를 'YYYY-MM-DD' 형태의 문자열로 변환
const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getLastDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
};

// 메인 켈린더 컴포넌트
const CalendarPage = () => {
    // API를 통해 받아온 실제 축제 데이터들을 저장
    const [festivals, setFestivals] = useState<MyFestival[]>([]);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

                const response = await axios.get(API_URL, {
                    params: {
                        numOfRows: 50,
                        pageNo: 1,
                        arrange: "B",
                        eventStartDate: startDateString,
                        eventEndDate: endDateString,
                    },
                });
                console.log("서버로부터 받은 전체 데이터:", response.data);

                const festivalListFromApi = response.data.response.body.items.item || [];
                const transformedFestivals: MyFestival[] = festivalListFromApi.map(
                    (item: any) => {
                        return {
                            serviceKey: SERVICE_KEY,
                            id: item.contentid,
                            contenttypeid: item.contenttypeid,
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
                setFestivals(transformedFestivals); // 변환된 데이터들을 우리 바구니에 넣어줌. (화면이 새로 랜더링)
            } catch (err) {
                console.error("API 호출 중 에러 발생:", err);
            }
        };

        fetchFestivals();
    }, [currentYear, currentMonth]);

    // useMemo는 'festivals' 데이터가 바뀔 때만 아래의 복잡한 계산들을 다시 실행해서,
    // 불필요한 재계산을 막아 앱의 성능을 향상시키는 똑똑한 기능입니다.

    // 이유: 우리가 만든 MyFestival은 'startdate' 속성을 쓰지만, FullCalendar 라이브러리는 'start'라는 속성 이름을 요구합니다.
    // 따라서, 달력에 데이터를 표시하기 직전에, 이름만 바꿔주는 '출력용' 데이터를 새로 만듭니다.
    const calendarEvents = useMemo(() => { // 'festivals' 배열이 바뀔 때만 이 함수가 다시 실행됩니다.
        return festivals.map(festival => { // 'festivals' 배열의 각 항목을 하나씩 순회합니다.
            // FullCalendar는 종료일을 그 날짜 '전까지'로 인식하는 특성이 있습니다.
            // 예를 들어 25일에 끝나는 행사를 달력에 25일까지 색칠하려면, 종료일을 26일로 설정해야 합니다.
            const endDate = new Date(festival.enddate); // 우리 데이터의 종료일 문자열로 Date 객체를 만듭니다.
            endDate.setDate(endDate.getDate() + 1); // 만든 Date 객체의 날짜에 +1일을 더합니다.

            return { // 달력이 알아들을 수 있는 새로운 객체를 만들어서 반환합니다.
                id: festival.id, // 축제 ID는 그대로 전달합니다.
                title: festival.title, // 축제 제목도 그대로 전달합니다.
                start: festival.startdate, // MyFestival의 'startdate' 값을 FullCalendar가 사용할 'start' 속성에 넣어줍니다.
                end: toYYYYMMDD(endDate),  // 위에서 +1일 처리한 종료일을 'YYYY-MM-DD' 형식으로 바꿔서 'end' 속성에 넣어줍니다.
            };
        });
    }, [festivals]); // 이 useMemo는 오직 'festivals' 데이터가 변경될 때만 다시 계산을 수행합니다.


    // 날짜별로 몇 개의 축제가 진행 중인지 개수를 계산합니다.
    const festivalCountsByDate = useMemo(() => { // 'festivals' 배열이 바뀔 때만 이 함수가 다시 실행됩니다.
        const counts: { [date: string]: number } = {}; // 날짜를 키, 축제 개수를 값으로 하는 빈 객체를 만듭니다. 예: { "2025-07-20": 2 }
        festivals.forEach((festival) => { // 모든 축제 데이터를 하나씩 순회합니다.
            let currentDate = new Date(festival.startdate); // 각 축제의 시작일부터 루프를 시작합니다.
            const finalDate = new Date(festival.enddate); // 각 축제의 종료일까지 루프를 돕니다.

            while (currentDate <= finalDate) { // 시작일부터 종료일까지 하루씩 반복합니다.
                const dateStr = toYYYYMMDD(currentDate); // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 바꿉니다.
                counts[dateStr] = (counts[dateStr] || 0) + 1; // 해당 날짜의 카운트를 1 올립니다. (원래 값이 없었으면 0에서 시작)
                currentDate.setDate(currentDate.getDate() + 1); // 다음 날로 날짜를 이동시킵니다.
            }
        });
        return counts; // 모든 계산이 끝난 최종 개수 객체를 반환합니다.
    }, [festivals]); // 이 useMemo도 오직 'festivals' 데이터가 변경될 때만 다시 계산을 수행합니다.

    // 사용자가 달력에서 선택한 날짜에 해당하는 축제 목록만 골라냅니다.
    const festivalsForSelectedDate = useMemo(() => { // 'selectedDate'나 'festivals'가 바뀔 때만 다시 실행됩니다.
        if (!selectedDate) return []; // 만약 선택된 날짜가 없다면, 빈 배열을 반환하고 즉시 종료합니다.

        // 전체 축제 목록에서 필터링을 시작합니다.
        return festivals.filter((festival) => {
            // "선택된 날짜가 축제 기간(시작일 ~ 종료일) 사이에 있는지" 확인하는 로직입니다.
            const startDate = new Date(festival.startdate); // 축제의 시작일을 Date 객체로 만듭니다.
            const endDate = new Date(festival.enddate); // 축제의 종료일을 Date 객체로 만듭니다.
            const sDate = new Date(selectedDate); // 사용자가 클릭한 날짜도 Date 객체로 만듭니다.
            return sDate >= startDate && sDate <= endDate; // 선택일이 시작일과 같거나 크고, 종료일과 같거나 작으면 true를 반환 (목록에 포함)
        });
    }, [selectedDate, festivals]); // 이 useMemo는 'selectedDate' 또는 'festivals'가 바뀔 때마다 다시 계산합니다.

    // 달력의 날짜를 '클릭'했을 때 어떤 일을 할지 정의하는 함수입니다.
    const handleDateClick = (clickInfo: DateClickArg) => { // FullCalendar가 클릭 정보를 'clickInfo' 객체에 담아 전달해줍니다.
        setSelectedDate((prev) => // 현재 'selectedDate'의 값을 확인하고 새로운 값을 결정합니다.
            prev === clickInfo.dateStr ? null : clickInfo.dateStr // 만약 이미 선택된 날짜를 또 클릭했다면 선택을 해제(null)하고, 다른 날짜를 클릭했다면 그 날짜로 설정합니다.
        );
    };

    // 달력의 '이전', '다음' 버튼을 눌러서 보이는 월이 바뀔 때마다 실행되는 함수입니다.
    const handleDatesSet = (dateInfo: any) => { // FullCalendar가 변경된 날짜 정보를 'dateInfo'에 담아 전달합니다.
        const newDate = dateInfo.view.currentStart; // 새로 보여지는 달의 시작 날짜(예: 8월 1일)를 가져옵니다.
        setCurrentYear(newDate.getFullYear()); // 그 날짜에서 '년도'를 추출해서 상태를 업데이트합니다.
        setCurrentMonth(newDate.getMonth() + 1); // 그 날짜에서 '월'을 추출해서 상태를 업데이트합니다. (getMonth는 0~11을 반환하므로 +1)
    };

    const handleEventClick = (festivalId: string) => {
        navigate(`/calender/${festivalId}`);
    };

    return (
        <div className="festival-calendar-container">
            <div className="custom-header">
                <div className="header-title">월별 축제 달력</div>
            </div>
            <FullCalendar // FullCalendar 라이브러리의 메인 컴포넌트입니다.
                plugins={[dayGridPlugin, interactionPlugin]} // '월별 달력'과 '클릭 같은 상호작용' 기능을 사용하겠다고 선언합니다.
                initialView="dayGridMonth" // 달력의 기본 보기 형식을 '월별'로 설정합니다.
                locale="ko" // 달력의 언어를 한국어로 설정합니다. (요일, 월 등)
                events={[]} // [핵심 연결!] 달력에 표시할 이벤트 목록으로, 위에서 최종 변환한 'calendarEvents'를 사용합니다.
                headerToolbar={{
                    left: "prev",
                    center: "title",
                    right: "next"
                }} // 달력 상단 툴바의 구성을 설정합니다. (이전 버튼, 제목, 다음 버튼)
                dateClick={handleDateClick} // 달력의 날짜를 클릭했을 때, 위에서 만든 'handleDateClick' 함수를 실행하도록 연결합니다.
                datesSet={handleDatesSet} // 달력의 월이 바뀌었을 때, 위에서 만든 'handleDatesSet' 함수를 실행하도록 연결합니다.
                dayCellContent={(arg) => { // 달력의 각 '날짜 칸'의 내용을 직접 꾸미는 기능입니다.
                    const dateStr = toYYYYMMDD(arg.date); // 해당 칸의 날짜를 'YYYY-MM-DD' 형식으로 바꿉니다.
                    const count = festivalCountsByDate[dateStr] || 0; // 위에서 계산한 축제 개수 객체에서 해당 날짜의 개수를 가져옵니다.
                    return ( // 이 JSX가 각 날짜 칸 안에 실제로 렌더링됩니다.
                        <div className="day-content-wrapper"> {/* 날짜 칸 내부를 감싸는 래퍼입니다. */}
                            <div className="day-number"> {/* 날짜 숫자를 표시하는 부분입니다. */}
                                {arg.dayNumberText.replace("일", "")} {/* '20일' 에서 '일'을 뺀 숫자 '20'만 표시합니다. */}
                            </div>
                            {count > 0 && ( // 만약 축제 개수가 1개 이상일 때만 아래 내용을 보여줍니다.
                                <div className="day-event-info"> {/* 축제 정보(개수)를 표시하는 영역입니다. */}
                                    <span className="day-event-count">{count}개</span> {/* "N개" 형식으로 개수를 보여줍니다. */}
                                </div>
                            )}
                        </div>
                    );
                }}
                dayCellDidMount={(arg) => { // 각 '날짜 칸'이 화면에 그려진 직후에 실행되는 함수입니다.
                    arg.el.classList.toggle( // 해당 날짜 칸(DOM 요소)의 CSS 클래스를 조작합니다.
                        "selected-date", // 'selected-date' 라는 클래스 이름을
                        selectedDate === toYYYYMMDD(arg.date) // 'selectedDate'와 현재 칸의 날짜가 같으면 추가하고, 다르면 제거합니다.
                    );
                }}
            />
            {selectedDate && ( // 'selectedDate'에 날짜 값이 있을 때만(클릭했을 때만) 이 부분을 화면에 보여줍니다.
                <div className="festival-list-container">
                    <h3>{selectedDate}의 축제 목록</h3>
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

