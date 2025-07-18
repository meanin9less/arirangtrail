import React, {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";
import {Swiper, SwiperSlide} from "swiper/react";
import {Navigation, Pagination} from "swiper/modules";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import "./detail.css"

// 네이버 지도 API의 타입 선언
declare global {
    interface Window {
        naver: any;
    }
}

interface FestivalDetail {
    title: string;
    contentid: string;
    addr1: string;
    addr2: string;
    homepage: string;
    firstimage: string;
    firstimage2: string;
    mapx: string;
    mapy: string;
    tel: string;
    overview: string;
}

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

    // // 네이버 지도 설정
    // useEffect(() => {
    //     // festival 데이터나 네이버 지도 API(window.naver)가 준비되지 않았으면 아무것도 하지 않습니다.
    //     if (!festival || !festival.mapy || !festival.mapx || !window.naver) {
    //         return;
    //     }
    //
    //     const mapContainer = document.getElementById('map'); // 지도를 담을 영역
    //     if (!mapContainer) return; // 지도를 담을 영역이 없으면 중단
    //
    //     // 네이버 지도 옵션을 설정합니다.
    //     const mapOptions = {
    //         center: new window.naver.maps.LatLng(festival.mapy, festival.mapx),
    //         zoom: 15, // 네이버 지도의 확대 수준 (숫자가 클수록 확대됨)
    //         zoomControl: true, // 확대/축소 컨트롤 표시
    //     };
    //
    //     // 지도를 생성합니다.
    //     const map = new window.naver.maps.Map(mapContainer, mapOptions);
    //
    //     // 마커(위치 표시)를 생성합니다.
    //     new window.naver.maps.Marker({
    //         position: new window.naver.maps.LatLng(festival.mapy, festival.mapx),
    //         map: map, // 생성한 지도에 마커를 추가합니다.
    //     });
    //
    // }, [festival]); // festival 데이터가 로드된 후에만 이 코드가 실행됩니다.

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <span>Loading data</span>
            </div>
        );
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
                    <li className="info-item">
                        <span className="info-label">주소</span>
                        <div className="info-content">{festival.addr1}</div>
                    </li>
                    {festival.tel && (
                        <li className="info-item">
                            <span className="info-label">연락처</span>
                            <div className="info-content">{festival.tel}</div>
                        </li>
                    )}
                    {festival.homepage && (
                        <li className="info-item">
                            <span className="info-label">홈페이지</span>
                            <div className="info-content" dangerouslySetInnerHTML={{__html: festival.homepage}}/>
                        </li>
                    )}
                </ul>
                <div className="detail-map-section">
                    <h3 className="section-title">위치 정보</h3>
                    <div id="map" style={{width: '100%', height: '400px'}}></div>
                </div>
            </div>
        </div>
    );
};

export default DetailPage;