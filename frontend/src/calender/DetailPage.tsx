import React, {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";
import {Swiper, SwiperSlide} from "swiper/react";
import {Navigation, Pagination} from "swiper/modules";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import "./detail.css"

// 구글맵 API 타입 선언
declare global {
    interface Window {
        google: any;
    }
}

// API 요청 축제 상세 정보 데이터
interface FestivalDetail {
    title: string;
    contentid: string;
    addr1: string;
    addr2: string;
    homepage: string;
    firstimage: string;
    firstimage2: string;
    mapx: string; // 경도(longitude)
    mapy: string; // 위도(latitude)
    tel: string;
    overview: string;
}

// API 요청 추가이미지 정보 데이터
interface ImageItem {
    contentid: string;
    imgname: string;
    originimgurl: string;
    serialnum: string;
    smallimageurl: string;

}


const DetailPage = () => {
    const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
    const {festivalId} = useParams<{ festivalId: string }>();
    const [festival, setFestival] = useState<FestivalDetail | null>(null);
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); // 사용자 현재 위치를 저장할 공간.

    useEffect(() => {
        if (festivalId) {
            const fetchDetail = async () => {
                const API_URL =
                    `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
                try {
                    const response = await axios.get(API_URL, {
                        params: {
                            numOfRows: 50,
                            pageNo: 1,
                            contentId: festivalId, // contentId 요청보낼때는 id 대문자로, 받을때는 소문자로
                        }
                    });
                    console.log(response.data);

                    const item = response.data.response.body.items.item[0];
                    setFestival({
                        title: item.title,
                        contentid: item.contentid,
                        addr1: item.addr1,
                        addr2: item.addr2,
                        homepage: item.homepage,
                        firstimage: item.firstimage,
                        firstimage2: item.firstimage2,
                        mapx: item.mapx,
                        mapy: item.mapy,
                        tel: item.tel,
                        overview: item.overview
                    });
                } catch (e) {
                    console.error("상세 정보 로딩 실패:", e);
                } finally {
                    setIsLoading(false); // 요청이 성공하든 실패하든 로딩 상태를 false로 변경
                }
            };
            fetchDetail();
        }
    }, [festivalId]);

    useEffect(() => {
        if (festivalId) {
            const fetchImages = async () => {
                const API_URL =
                    `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
                try {
                    const response = await axios.get(API_URL, {
                        params: {
                            numOfRows: 50,
                            pageNo: 1,
                            contentId: festivalId,
                            imageYN: 'Y',
                        }
                    });
                    console.log(response.data);

                    const imageList = response.data.response.body.items.item || [];
                    setImages(imageList);

                } catch (e) {
                    console.error("추가 이미지 로딩 실패:", e);
                } finally {
                    setIsLoading(false); // 요청이 성공하든 실패하든 로딩 상태를 false로 변경
                }
            };
            fetchImages();
        }
    }, [festivalId]);

    useEffect(() => {
        // festival 데이터나 '구글맵' API(window.google)가 준비되지 않았으면 실행하지 않음
        if (!festival || !festival.mapy || !festival.mapx || !window.google) return;

        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        const lat = parseFloat(festival.mapy);
        const lng = parseFloat(festival.mapx);
        const position = {lat: lat, lng: lng}; // 구글맵은 {lat, lng} 객체를 사용합니다.

        // 구글맵 옵션
        const mapOptions = {
            center: position,
            zoom: 15,
            disableDefaultUI: true, // 기본 UI(스트리트뷰, 확대/축소 등)를 숨겨서 깔끔하게
            zoomControl: true,
        };

        // 구글맵 생성
        const map = new window.google.maps.Map(mapContainer, mapOptions);

        // 구글맵 마커 생성
        const marker = new window.google.maps.Marker({
            position: position,
            map: map,
        });

        // 구글맵 인포윈도우 생성
        const infowindow = new window.google.maps.InfoWindow({
            content: `<div class="google-infowindow">${festival.title}</div>`
        });

        marker.addListener('click', () => {
            infowindow.open({
                anchor: marker,
                map,
            });
        });

    }, [festival]);

    // 현재 위치로 길찾기 함수
    const handleRouteFromCurrentLocation = () => {
        if (!festival) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {latitude, longitude} = position.coords;
                setUserLocation({lat: latitude, lng: longitude});
                const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${festival.mapy},${festival.mapx}`;
                window.open(url, '_blank');
            },
            (error) => {
                alert("위치 정보를 가져오는 데 실패했습니다. 브라우저 설정을 확인해주세요.");
                console.error("Geolocation Error:", error);
            }
        );
    };

    if (isLoading) {
        return <div className="loading-overlay"><span>축제 정보를 불러오는 중...</span></div>;
    }
    if (!festival) {
        return <div className="error-message">해당 축제 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="festival-detail-container">
            {isLoading && (
                <div className="loading-overlay">
                    <span>Loading data</span>
                </div>
            )}
            <div className="detail-header">
                <h1 className="detail-title">{festival.title}</h1>
            </div>
            <div className="swiper-container">
                <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={0}
                    slidesPerView={1}
                    navigation
                    pagination={{clickable: true}}
                >
                    <SwiperSlide key={festival.firstimage}>
                        <img src={festival.firstimage} alt={festival.title}/>
                    </SwiperSlide>
                    {images.map(image => (
                        <SwiperSlide key={image.serialnum}>
                            <img src={image.originimgurl} alt={image.imgname}/>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className="detail-content-wrapper">

                <ul className="detail-info-list">
                    <li className="info-item">
                        <span className="info-label">소개</span>
                        <div className="info-content" dangerouslySetInnerHTML={{__html: festival.overview}}/>
                    </li>
                    {festival.homepage && (
                        <li className="info-item">
                            <span className="info-label">홈페이지</span>
                            <div className="info-content" dangerouslySetInnerHTML={{__html: festival.homepage}}/>
                        </li>
                    )}
                    {festival.tel && (
                        <li className="info-item">
                            <span className="info-label">연락처</span>
                            <div className="info-content">{festival.tel}</div>
                        </li>
                    )}
                    <li className="info-item">
                        <span className="info-label">주소</span>
                        <div className="info-content">{festival.addr1}</div>
                    </li>
                </ul>
                <div className="detail-map-section">
                    <div className="section-header"><h3 className="section-title">위치 정보</h3></div>
                    <div id="map" style={{width: '100%', height: '400px'}}></div>
                </div>

                <div className="travel-guide-section">
                    <h3 className="section-title">오시는 길 (Directions)</h3>
                    <div className="travel-options">
                        <div className="option-card primary-action">
                            <div className="option-icon">📍</div>
                            <div className="option-info">
                                <h4>현재 위치에서 길찾기</h4>
                                <p>가장 빠르고 정확한 경로를 확인하세요. (위치 정보 제공 동의 필요)</p>
                                <button onClick={handleRouteFromCurrentLocation} className="primary-button">
                                    내 위치에서 출발
                                </button>
                            </div>
                        </div>
                        <div className="option-card">
                            <div className="option-icon">🚌🚆</div>
                            <div className="option-info">
                                <h4>대중교통 예매</h4>
                                <p>고속버스나 기차를 이용해 편하게 이동하세요.</p>
                                <div className="external-links">
                                    <a href="https://www.kobus.co.kr/main.do" target="_blank" rel="noopener noreferrer"
                                       className="option-link">고속버스 예매 (Kobus) →</a>
                                    <a href="https://www.letskorail.com/" target="_blank" rel="noopener noreferrer"
                                       className="option-link">기차 예매 (Korail) →</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailPage;