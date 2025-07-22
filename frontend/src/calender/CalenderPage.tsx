import React, {useEffect, useMemo, useState} from "react";

// FullCalendar 라이브러리에서 리액트용 달력 부품과 확장 기능들
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {DateClickArg} from "@fullcalendar/interaction";
import axios from "axios";
import "./calender.css"
import {useNavigate} from "react-router-dom";
import {IoCalendarOutline, IoLocationOutline} from "react-icons/io5";

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

//  Date 날짜 객체를 YYYY-MM-DD 형태의 문자열로 변환
const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 메인 켈린더 페이지 컴포넌트
const CalendarPage = () => {
    const [festivals, setFestivals] = useState<ApiFestival[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<string>("views");
    const navigate = useNavigate();

    // 외부 API 데이터 가져오기
    useEffect(() => {
        const fetchFestivals = async () => {
            const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
            const API_URL =
                `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            const today = new Date();
            const eventStartDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

            try {
                const response = await axios.get(API_URL, {
                    params: { // 요청 파라미터
                        numOfRows: 150,
                        pageNo: 1,
                        arrange: "B", // 조회순
                        eventStartDate, // 오늘부터 시작하는 행사만 요청
                    },
                });
                setFestivals(response.data.response.body.items.item || []);
            } catch (e) {
                console.error("API 호출 중 에러 발생:", e);
            } finally {
                setIsLoading(false); // 요청이 성공하든 실패하든 로딩 상태를 false로 변경
            }
        };
        fetchFestivals();
    }, []);

    // 날짜별 축제 개수 계산 로직
    const festivalCountsByDate = useMemo(() => {
        const counts: { [date: string]: number } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        festivals.forEach((festival) => {
            const yyyymmddToDate = (d: string) => new Date(parseInt(d.substring(0, 4)), parseInt(d.substring(4, 6)) - 1, parseInt(d.substring(6, 8)));
            let currentDate = yyyymmddToDate(festival.eventstartdate);
            const finalDate = yyyymmddToDate(festival.eventenddate);

            while (currentDate <= finalDate) {
                if (currentDate >= today) {
                    counts[toYYYYMMDD(currentDate)] = (counts[toYYYYMMDD(currentDate)] || 0) + 1;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        return counts;
    }, [festivals]);


    // 선택된 날짜의 축제 목록을 필터링하고 정렬
    const festivalsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        const sDate = new Date(selectedDate);

        const yyyymmddToDate = (d: string) => new Date(parseInt(d.substring(0, 4)), parseInt(d.substring(4, 6)) - 1, parseInt(d.substring(6, 8)));

        const filtered = festivals.filter(f => {
            return sDate >= yyyymmddToDate(f.eventstartdate) && sDate <= yyyymmddToDate(f.eventenddate)
        });

        // 정렬 로직 적용
        switch (sortOrder) {
            case 'name':
                return filtered.sort((a, b) => a.title.localeCompare(b.title));
            case 'ending':
                return filtered.sort((a, b) => yyyymmddToDate(a.eventenddate).getTime() - yyyymmddToDate(b.eventenddate).getTime());
            default: // 'views'
                return filtered;
        }
    }, [selectedDate, festivals, sortOrder]);

    const handleDateClick = (clickInfo: DateClickArg) => {
        setSelectedDate(prev => prev === clickInfo.dateStr ? null : clickInfo.dateStr);
    };

    const handleEventClick = (festivalId: string) => {
        navigate(`/calender/${festivalId}`);
    };


    return (
        <div className="festival-calendar-container">
            {isLoading && <div className="loading-overlay"><span>Loading data</span></div>}
            <div className="custom-header"><div className="header-title">월별 축제 달력</div></div>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{left: "prev", center: "title", right: "next"}}
                dateClick={handleDateClick}
                dayCellContent={arg => {
                    const count = festivalCountsByDate[toYYYYMMDD(arg.date)] || 0;
                    return (
                        <div className="day-content-wrapper">
                            <div className="day-number">{arg.dayNumberText.replace("일", "")}</div>
                            {count > 0 && <div className="day-event-info"><span className="day-event-count">{count} 개</span></div>}
                        </div>
                    );
                }}
                dayCellClassNames={arg => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const classNames = [];
                    if (toYYYYMMDD(arg.date) === selectedDate) classNames.push('selected-date');
                    if (arg.date < today) classNames.push('past-date');
                    return classNames.join(' ');
                }}
            />
            {selectedDate && (
                <div className="festival-list-container">
                    <h3 className="festivals-list-title">{selectedDate}의 축제 목록</h3>
                    <div className="sort-buttons-container">
                        <button className={`sort-button ${sortOrder === 'views' ? 'active' : ''}`} onClick={() => setSortOrder('views')}>조회순</button>
                        <button className={`sort-button ${sortOrder === 'name' ? 'active' : ''}`} onClick={() => setSortOrder('name')}>이름순</button>
                        <button className={`sort-button ${sortOrder === 'ending' ? 'active' : ''}`} onClick={() => setSortOrder('ending')}>마감임박순</button>
                    </div>
                    {festivalsForSelectedDate.length > 0 ? (
                        <ul>
                            {festivalsForSelectedDate.map(festival => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const yyyymmddToDate = (d: string) => new Date(parseInt(d.substring(0, 4)), parseInt(d.substring(4, 6)) - 1, parseInt(d.substring(6, 8)));
                                const isOngoing = today >= yyyymmddToDate(festival.eventstartdate) && today <= yyyymmddToDate(festival.eventenddate);

                                return (
                                    <li key={festival.contentid} onClick={() => handleEventClick(festival.contentid)} className="festival-item">
                                        {festival.firstimage && <img src={festival.firstimage} alt={festival.title} className="festival-image"/>}
                                        <div className="festival-details">
                                            <h4 className="festival-card-title">
                                                {festival.title}
                                                {isOngoing && <span className="ongoing-badge">진행중</span>}
                                            </h4>
                                            <div className="festival-meta">
                                                <span className="meta-item"><IoLocationOutline/> {`${festival.addr1} ${festival.addr2}`.trim() || '주소 정보 없음'}</span>
                                                <span className="meta-item"><IoCalendarOutline/>
                                                    {`${festival.eventstartdate.substring(0, 4)}-${festival.eventstartdate.substring(4, 6)}-${festival.eventstartdate.substring(6, 8)}`} ~ {`${festival.eventenddate.substring(0, 4)}-${festival.eventenddate.substring(4, 6)}-${festival.eventenddate.substring(6, 8)}`}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
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

