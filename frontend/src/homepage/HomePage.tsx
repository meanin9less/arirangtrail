import React, {useState, useEffect} from 'react';
import axios from "axios";
import styles from "./HomePage.module.css";
import NavigationBar from "../navigation/NavigationBar";

interface HomePageFestival {
    contenttypeid: string;
    contentid: string;
    eventstartdate: string;
    eventenddate: string;
    firstimage: string; // 이미지 URL 1
    firstimage2: string; // 이미지 URL 2 (더 작은 이미지)
}

// 메인 캘린더 페이지 컴포넌트
const HomePage = () => {
    // API를 통해 받아온 실제 축제 데이터들 중 이미지 URL만 저장할 상태
    const [fetchedImages, setFetchedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // 오류 메시지 상태 추가

    // 현재 배경 이미지 인덱스를 관리하는 상태
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 축제 데이터를 가져오는 비동기 함수
    useEffect(() => {
        const fetchFestivalImages = async () => {
            setIsLoading(true);
            setError(null); // 새로운 요청 전에 오류 상태 초기화

            const today = new Date();
            const year = today.getFullYear();
            const month = ('0' + (today.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 +1, 두 자리로 포맷팅
            const day = ('0' + today.getDate()).slice(-2); // 두 자리로 포맷팅
            const todayString = `${year}${month}${day}`;

            // 팀원이 주신 URL 인코딩된 키를 먼저 디코딩합니다.
            // axios의 params가 자동으로 URL 인코딩을 처리하므로, 여기서는 순수한 키를 사용합니다.
            const ENCODED_SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
            const DECODED_SERVICE_KEY = decodeURIComponent(ENCODED_SERVICE_KEY); // 키 디코딩

            const API_ENDPOINT = `https://apis.data.go.kr/B551011/KorService2/searchFestival2`;

            try {
                const response = await axios.get(API_ENDPOINT, {
                    params: {
                        serviceKey: DECODED_SERVICE_KEY, // 디코딩된 키 사용
                        MobileApp: 'AppTest',
                        MobileOS: 'ETC',
                        _type: 'json',
                        numOfRows: 50, // 충분한 이미지 확보를 위해 넉넉하게 요청
                        pageNo: 1,
                        arrange: "A", // 조회순
                        eventStartDate: todayString, // 오늘 날짜 이후의 축제
                    }
                });

                console.log("TourAPI 응답 데이터 (축제 목록):", response.data);
                const items = response.data.response?.body?.items?.item || [];

                // 유효한 이미지 URL만 필터링하고 'url()' 형식으로 변환
                const imageUrls = items
                    .filter((item: HomePageFestival) => item.firstimage || item.firstimage2)
                    .map((item: HomePageFestival) => `url(${item.firstimage || item.firstimage2})`);

                if (imageUrls.length > 0) {
                    setFetchedImages(imageUrls);
                } else {
                    setError("TourAPI에서 유효한 축제 이미지를 찾을 수 없습니다.");
                }

            } catch (err: any) {
                console.error("Failed to fetch images from TourAPI:", err);
                let errorMessage = `이미지를 불러오는 데 실패했습니다: ${err.message}.`;
                if (axios.isAxiosError(err) && err.response) {
                    errorMessage += ` 서버 응답: ${err.response.status} ${err.response.statusText}.`;
                    console.error("서버 응답 데이터:", err.response.data);
                }
                setError(errorMessage + " 잠시 후 다시 시도해주세요.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFestivalImages();
    }, []); // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행

    // 이미지 전환 효과를 위한 useEffect
    useEffect(() => {
        if (fetchedImages.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    (prevIndex + 1) % fetchedImages.length
                );
            }, 5000); // 5초마다 이미지 전환

            return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
        }
    }, [fetchedImages.length]); // fetchedImages 배열의 길이가 변경될 때마다 다시 설정

    // 로딩 중일 때 표시
    if (isLoading) {
        return (
            <div className={styles.messageContainer}>
                <p>이미지를 불러오는 중입니다...</p>
            </div>
        );
    }

    // 오류 발생 시 표시
    if (error) {
        return (
            <div className={`${styles.messageContainer} ${styles.errorMessage}`}>
                <p>{error}</p>
            </div>
        );
    }

    // 이미지가 없을 때 표시
    if (fetchedImages.length === 0) {
        return (
            <div className={styles.messageContainer}>
                <p>표시할 이미지가 없습니다.</p>
            </div>
        );
    }

    // 이미지가 있을 때 배경 이미지와 함께 렌더링
    return (
        <div className={styles.homePageLayout}>
            <NavigationBar/>
            <div
                className={styles.homeContainer}
                style={{
                    backgroundImage: fetchedImages.length > 0 ? fetchedImages[currentImageIndex] : 'none',
                }}
            >
                <div className={styles.overlay}></div>
            </div>
        </div>
    );
};

export default HomePage;
