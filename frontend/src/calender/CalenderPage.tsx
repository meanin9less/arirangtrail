// --- 1. 필요한 도구와 부품들 가져오기 (import) ---
// 리액트의 핵심 기능과, 컴포넌트의 '기억(상태)'을 관리하고, API 호출 시점을 정할 도구들을 불러옵니다.
import React, {useState, useEffect, useMemo} from "react";
// FullCalendar 라이브러리에서 리액트용 달력 부품과 확장 기능들을 가져옵니다.
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {DateClickArg} from "@fullcalendar/interaction";
// 인터넷을 통해 데이터를 요청하는 '택배기사' 역할을 할 axios를 가져옵니다.
import axios from "axios";
// 우리가 직접 꾸밀 디자인(CSS) 파일을 가져옵니다.
import "../css/calendar.css"

// --- 2. 데이터의 '설계도' 정의하기 ---

// (1) 외부용 설계도: API 응답의 'item' 객체 하나의 모양
// 우리가 사용할 데이터만 골라서 정의합니다. (전부 다 쓸 필요 없음!)
interface ApiFestivalItem {
    title: string;          // "title": "베어트리파크 봄꽃 축제"
    addr1: string;          // "addr1": "세종특별자치시..."
    eventstartdate: string; // "eventstartdate": "20250329"
    eventenddate: string;   // "eventenddate": "20250511"
    firstimage: string;     // "firstimage": "http://..."
    tel: string;            // "tel": "044-866-7766"
}

// (2) 내부용 설계도: 우리 앱에서 사용할 최종 데이터의 모양
interface Festival {
    id: string;
    title: string;
    start: string;
    end: string;
    location: string;
    image?: string; // 이미지는 없을 수도 있으니 '?'를 붙여 선택적 속성으로 만듭니다.
    tel?: string;
}

// --- 3. 작은 '도우미' 함수 만들기 ---
// new Date()로 만들어진 날짜 객체는 다루기 복잡해서, 'YYYY-MM-DD' 형태의 예쁜 문자열로 바꿔주는 도우미입니다.
const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// --- 4. '축제 달력'이라는 이름의 메인 부품 만들기 시작 ---
const CalendarPage = () => {
    // --- 4-1. 이 부품이 기억해야 할 중요한 정보들(상태, State) 정의 ---
    // API를 통해 받아온 실제 축제 데이터들을 저장할 '바구니'입니다. 처음엔 비어있습니다.
    const [festivals, setFestivals] = useState<Festival[]>([]);
    // 사용자가 달력을 넘겨서 보게 될 '현재 연도'를 기억하는 공간입니다.
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    // 사용자가 보게 될 '현재 월'을 기억하는 공간입니다.
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    // 사용자가 클릭한 '선택된 날짜'를 기억하는 공간입니다.
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    // API 요청이 진행 중인지(로딩 중인지) 알려주는 스위치입니다. 처음엔 로딩 상태가 아닙니다.
    const [isLoading, setIsLoading] = useState(false);
    // 만약 에러가 발생하면, 어떤 에러인지 기록해 둘 메모장입니다.
    const [error, setError] = useState<string | null>(null);

    // --- 4-2. API 데이터를 가져오는 '심장' 같은 부분 (useEffect) ---
    // 이 코드는 '감시카메라'와 같습니다. [currentYear, currentMonth] 값이 바뀔 때마다 아래의 모든 코드를 다시 실행합니다.
    useEffect(() => {
        // 'fetchFestivals'라는 이름의, 서버에 데이터를 요청하는 함수를 만듭니다.
        const fetchFestivals = async () => {
            setIsLoading(true); // "지금부터 데이터 가지러 갈게!" 로딩 스위치를 켭니다.
            setError(null); // 혹시 이전에 에러가 있었다면, 일단 깨끗하게 지우고 시작합니다.

            try {
                // 'try-catch'는 "일단 시도해보고, 만약 실패하면 알려줘" 라는 뜻의 안전장치입니다.

                // [핵심!] axios 택배기사를 시켜 API 서버로 '데이터 요청서'를 보냅니다.
                const response = await axios.get(
                    // =================================================================
                    // ▼▼▼ 1. 나중에 여기에 실제 API 주소를 넣어주세요. ▼▼▼
                    "YOUR_API_ENDPOINT_HERE", // 예: 'https://korean.visitkorea.or.kr/kfes/list/selectFstvlCal.do'
                    // =================================================================
                    {
                        // 상세 요청 내용 (params)
                        params: {
                            // =================================================================
                            // ▼▼▼ 2. API 문서에 맞는 파라미터 이름을 여기에 넣어주세요. ▼▼▼
                            searchYr: currentYear,
                            searchMn: currentMonth.toString().padStart(2, "0"),
                            // =================================================================
                        },
                    }
                );

                // [가장 중요!] 서버가 준 데이터(response.data)를 우리 앱에 맞게 변환하는 과정입니다.
                // 서버가 준 데이터 묶음이 response.data.resultList 에 들어있다고 가정합니다.
                // 이 부분은 실제 API 응답 구조를 보고 수정해야 합니다.
                const festivalListFromApi = response.data.resultList || [];

                const transformedFestivals: Festival[] = festivalListFromApi.map(
                    (item: ApiFestival) => {
                        // 'YYYYMMDD'를 'YYYY-MM-DD' 형식으로 바꿔줍니다.
                        const startDate = `${item.fstvlBgngDe.substring(
                            0,
                            4
                        )}-${item.fstvlBgngDe.substring(4, 6)}-${item.fstvlBgngDe.substring(
                            6,
                            8
                        )}`;
                        const endDateRaw = new Date(
                            `${item.fstvlEndDe.substring(0, 4)}-${item.fstvlEndDe.substring(
                                4,
                                6
                            )}-${item.fstvlEndDe.substring(6, 8)}`
                        );
                        endDateRaw.setDate(endDateRaw.getDate() + 1); // 종료일은 +1일 해야 달력에 예쁘게 표시됩니다.
                        const endDate = toYYYYMMDD(endDateRaw);

                        // 최종적으로 우리 앱이 사용할 'Festival' 모양으로 조립해서 반환합니다.
                        return {
                            id: `${item.fstvlBgngDe}-${item.fstvlNm}`,
                            title: item.fstvlNm,
                            start: startDate,
                            end: endDate,
                            location: item.opnhmVenu,
                        };
                    }
                );

                setFestivals(transformedFestivals); // 예쁘게 변환된 데이터들을 우리 '축제 바구니'에 넣어줍니다. (이때 화면이 새로 그려집니다!)
            } catch (err) {
                // 만약 위 'try' 과정에서 뭔가 실패하면(catch), 여기로 빠집니다.
                console.error("API 호출 중 에러 발생:", err); // 개발자에게만 자세한 에러 내용을 보여줍니다.
                setError("축제 정보를 불러오는 데 실패했습니다."); // 사용자에게 보여줄 간단한 에러 메시지를 메모장에 기록합니다.
            } finally {
                // 성공하든 실패하든, 모든 작업이 끝나면 무조건 실행됩니다.
                setIsLoading(false); // "데이터 가져오는 일 끝났어!" 로딩 스위치를 끕니다.
            }
        };

        fetchFestivals(); // 위에서 길게 만든 'fetchFestivals' 함수를 여기서 실제로 실행시킵니다.
    }, [currentYear, currentMonth]); // 이 useEffect 감시카메라가 지켜볼 값들입니다.

    // --- 4-3. 나머지 계산 로직들 (useMemo) ---
    // 날짜별 축제 개수를 계산합니다. 'festivals' 데이터가 바뀔 때만 다시 계산해서 성능을 아낍니다.
    const festivalCountsByDate = useMemo(() => {
        const counts: { [date: string]: number } = {};
        festivals.forEach((festival) => {
            // (이 부분은 여러 날에 걸친 행사를 매일 카운트하도록 더 복잡한 로직이 필요하지만, 일단은 시작일 기준으로만 카운트합니다.)
            if (festival.start) {
                counts[festival.start] = (counts[festival.start] || 0) + 1;
            }
        });
        return counts;
    }, [festivals]);

    // 선택된 날짜에 해당하는 축제 목록만 골라냅니다. 'selectedDate'가 바뀔 때만 다시 계산합니다.
    const festivalsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return festivals.filter((festival) => festival.start === selectedDate);
    }, [selectedDate, festivals]);

    // --- 4-4. 사용자의 행동에 반응하는 함수들 (이벤트 핸들러) ---
    // 달력의 날짜를 '클릭'했을 때 어떤 일을 할지 정의하는 함수입니다.
    const handleDateClick = (clickInfo: DateClickArg) => {
        setSelectedDate((prev) =>
            prev === clickInfo.dateStr ? null : clickInfo.dateStr
        );
    };

    // 달력의 '이전', '다음' 버튼을 눌러서 보이는 월이 바뀔 때마다 실행되는 함수입니다.
    const handleDatesSet = (dateInfo: any) => {
        const newDate = dateInfo.view.currentStart;
        setCurrentYear(newDate.getFullYear());
        setCurrentMonth(newDate.getMonth() + 1);
    };

    // --- 4-5. 화면에 보여줄 최종 모습 그리기 (JSX) ---
    // 만약 에러 메모장에 글자가 있다면, 달력 대신 에러 메시지를 보여줍니다.
    if (error) return <div className="info-message">에러: {error}</div>;
    // 만약 로딩 스위치가 켜져 있다면, 로딩 메시지를 보여줍니다.
    if (isLoading) return <div className="info-message">로딩 중...</div>;

    // 에러도 없고 로딩 중도 아니라면, 정상적인 달력 화면을 보여줍니다.
    return (
        <div className="festival-calendar-container">
            <div className="custom-header">
                <div className="header-title">월별 축제 달력 (API 연동)</div>
            </div>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="ko"
                events={festivals} // [가장 중요!] 달력의 행사 목록은 이제 API로 받아온 'festivals' 바구니에 있는 것들입니다.
                headerToolbar={{left: "prev", center: "title", right: "next"}}
                dateClick={handleDateClick}
                datesSet={handleDatesSet} // [중요] 달력의 월이 바뀔 때마다 'handleDatesSet' 함수를 실행시켜 주세요.
                dayCellContent={(arg) => {
                    const dateStr = toYYYYMMDD(arg.date);
                    const count = festivalCountsByDate[dateStr] || 0;
                    return (
                        <div className="day-content-wrapper">
                            <div className="day-number">
                                {arg.dayNumberText.replace("일", "")}
                            </div>
                            {count > 0 && (
                                <div className="day-event-info">
                                    <span className="day-event-count">{count}개</span>
                                </div>
                            )}
                        </div>
                    );
                }}
                dayCellDidMount={(arg) => {
                    arg.el.classList.toggle(
                        "selected-date",
                        selectedDate === toYYYYMMDD(arg.date)
                    );
                }}
            />
            {selectedDate && (
                <div className="festival-list-container">
                    {/* ... 클릭 시 축제 목록 보여주는 부분 (이전과 동일) ... */}
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
