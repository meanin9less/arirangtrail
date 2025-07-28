import {
    IoBusiness,
    IoCalendarOutline,
    IoCall,
    IoFastFoodOutline,
    IoInformationCircleOutline,
    IoLink, IoLocationOutline,
    IoPin,
    IoPricetagOutline,
    IoTimeOutline,
    IoShareSocialOutline, IoHeartOutline, IoHeart, IoBusOutline, IoTrainOutline,
} from "react-icons/io5";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {Swiper, SwiperSlide} from "swiper/react";
import {Navigation, Pagination} from "swiper/modules";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import "./detail.css"
import WeatherWidget from "../WeatherWidget";
import ShareApi from "../ShareApi";
import apiClient from "../api/axiosInstance";
import {useSelector} from "react-redux";
import {RootState} from "../store";

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

// API 요청 추가이미지 데이터
interface ImageItem {
    contentid: string;
    imgname: string;
    originimgurl: string;
    serialnum: string;
    smallimageurl: string;
}

//API 요청 추가정보 데이터
interface AddInformation {
    playtime?: string; // 공연시간
    usetimefestival?: string; // 이용요금
    sponsor1?: string; // 주최자 정보
    eventstartdate: string;
    eventenddate: string;
}

interface FoodSearchList {
    contentid: string;
    addr1: string;
    addr2: string;
    title: string;
    tel: string;
    firstimage: string;
    firstimage2: string;
    mapx: string;
    mapy: string;
    dist: string;

}

const DetailPage = () => {
    const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
    const {festivalId} = useParams<{ festivalId: string }>();
    const [festival, setFestival] = useState<FestivalDetail | null>(null);
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [information, setInformation] = useState<AddInformation | null>(null);
    const [foodList, setFoodList] = useState<FoodSearchList[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달이 열렸는지 여부
    const [isLiked, setIsLiked] = useState(false); // 좋아요 상태
    const [likeCount, setLikeCount] = useState(0); // 좋아요 개수
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const userProfile = useSelector((state: RootState) => state.token.userProfile);
    const [selectedDestination, setSelectedDestination] = useState<{
        mapy: string;
        mapx: string;
        title: string;
    } | null>(null); // 선택된 목적지 정보

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

                    const item = response.data.response.body.items.item[0];
                    setFestival(item);

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
            const fetchInformation = async () => {
                const IMAGES_URL =
                    `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
                const Information_URL =
                    `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
                try {
                    const [imagesResponse, informationResponse] = await Promise.all([
                        axios.get(IMAGES_URL, {
                            params: {
                                numOfRows: 50,
                                pageNo: 1,
                                contentId: festivalId,
                                imageYN: 'Y',
                            }
                        }),
                        axios.get(Information_URL, {
                            params: {
                                numOfRows: 50,
                                pageNo: 1,
                                contentId: festivalId,
                                contentTypeId: 15,
                            }
                        }),
                    ]);
                    const imageList = imagesResponse.data.response.body.items.item || [];
                    setImages(imageList);
                    const infoData = informationResponse.data.response.body.items.item[0] || null;
                    setInformation(infoData);

                } catch (e) {
                    console.error("데이터 로딩 실패:", e);
                } finally {
                    setIsLoading(false); // 요청이 성공하든 실패하든 로딩 상태를 false로 변경
                }
            };
            fetchInformation();
        }
    }, [festivalId]);

    useEffect(() => {
        // 좌표값이 없으면 실행하지 않음
        if (!festival || !festival.mapx || !festival.mapy) return;

        const fetchFoodList = async () => {
            const API_URL = `https://apis.data.go.kr/B551011/KorService2/locationBasedList2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        mapX: festival.mapx, // 축제 장소의 X좌표
                        mapY: festival.mapy, // 축제 장소의 Y좌표
                        radius: 3000, // 3km 반경
                        numOfRows: 30,
                        pageNo: 1,
                        contentTypeId: 39, // 39 = 음식점
                    }
                });

                console.log(response.data);
                // API 응답 데이터에 타입을 명시적으로 지정 (ts.타입)
                const items: FoodSearchList[] = response.data.response.body.items.item || [];
                // 받아온 데이터에서 firstimage가 있는 아이템만 필터링
                const filteredFoodList = items.filter(food => food.firstimage && food.firstimage.trim() !== '');
                // 필터링된 리스트에서 최대 6개만 잘라서 상태에 저장
                setFoodList(filteredFoodList.slice(0, 6));
            } catch (e) {
                console.error("주변 맛집 데이터 로딩 실패:", e);
            }
        };

        fetchFoodList();
    }, [festival]); // festival 상태가 변경되면 실행

    useEffect(() => {
        // festival 데이터나 '구글맵' API(window.google)가 준비되지 않았으면 실행하지 않음
        if (!festival || !festival.mapy || !festival.mapx || !window.google) return;
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        const lat = parseFloat(festival.mapy);
        const lng = parseFloat(festival.mapx);
        const position = {lat: lat, lng: lng}; // 구글맵은 {lat, lng} 객체를 사용

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

    // // 현재 위치로 길찾기 함수
    // const handleRouteFromCurrentLocation = () => {
    //     if (!festival) return;
    //     navigator.geolocation.getCurrentPosition(
    //         (position) => {
    //             const {latitude, longitude} = position.coords;
    //             const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${festival.mapy},${festival.mapx}`;
    //             window.open(url, '_blank');
    //         },
    //         (error) => {
    //             alert("위치 정보를 가져오는 데 실패했습니다. 브라우저 설정을 확인해주세요.");
    //             console.error("Geolocation Error:", error);
    //         }
    //     );
    // };

    useEffect(() => {
        // 백엔드 API를 호출하여 현재 축제의 좋아요 상태와 개수를 가져옴
        const fetchLikeData = async () => {
            try {
                // 백엔드에 '좋아요' 상태를 확인하는 API 요청 (사용자 인증 정보 포함)
                const response = await apiClient.get(`/festivals/${festivalId}/status`);
                setIsLiked(response.data.isLiked);
                setLikeCount(response.data.likeCount);
                //set으로 공유횟수 만들면 좋다.
            } catch (error) {
                console.error("좋아요 상태 로딩 실패:", error);
            }
        };

        if (festivalId) { //
            fetchLikeData();
        }
    }, [festivalId, jwtToken]);

    const handleLikeClick = async () => {
        // 로그인 상태가 아니면 로그인 페이지로 유도
        if (!jwtToken) {
            alert("로그인이 필요한 기능입니다.");
            return;
        }

        // UI를 낙관적으로 업데이트 (선택 사항, 하지만 사용자 경험 향상)
        setIsLiked(prev => !prev);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        try {
            await apiClient.post(`/festivals/${festivalId}/like`, null, {
                    params: {
                        username: userProfile?.username
                    }
                }
            );
        } catch (error) {
            console.error("좋아요 처리 실패:", error);
            alert("요청 처리에 실패했습니다. 다시 시도해주세요.");
            // 실패 시 UI를 원래 상태로 되돌림
            setIsLiked(prev => !prev);
            setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
        }
    };

    // 모달을 여는 함수
    const openDirectionsModal = (destination: { mapy: string; mapx: string; title: string; }) => {
        setSelectedDestination(destination); // 어떤 장소인지 기억
        setIsModalOpen(true); // 모달 열기
    };

    // 모달을 닫는 함수
    const closeDirectionsModal = () => {
        setIsModalOpen(false);
        setSelectedDestination(null); // 선택 초기화
    };

    if (isLoading) {
        return <div className="loading-overlay"><span>축제 정보를 불러오는 중...</span></div>;
    }
    if (!festival) {
        return <div className="error-message">해당 축제 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="festival-detail-container">
            <div className="hero-section">
                {festival && (
                    <div
                        className="hero-background-blur"
                        style={{
                            backgroundImage: `url(${festival.firstimage})`
                        }}
                    />
                )}
                <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{clickable: true}}
                    className="hero-swiper"
                >
                    {festival.firstimage && (
                        <SwiperSlide key={festival.contentid}>
                            <img src={festival.firstimage} alt={festival.title} className="hero-image"/>
                        </SwiperSlide>
                    )}
                    {images.map(image => (
                        <SwiperSlide key={image.serialnum}>
                            <img src={image.originimgurl} alt={image.imgname} className="hero-image"/>
                        </SwiperSlide>
                    ))}
                </Swiper>
                <div className="hero-overlay"></div>
                <div className="hero-title-wrapper">
                    <h1 className="hero-title">{festival.title}</h1>
                </div>
            </div>

            <div className="detail-content-wrapper">
                <div className="main-content">
                    <div className="info-section">
                        <div className={"info-section2"}>
                            <h2 className="section-title"><IoInformationCircleOutline/>소개</h2>
                            <div className="actions-group">
                                <button
                                    onClick={handleLikeClick}
                                    className={`like-button ${isLiked ? 'active' : ''}`}
                                    disabled={!jwtToken}
                                    aria-label="가고 싶어요 버튼"
                                >
                                    {/* isLiked 상태에 따라 아이콘 변경 */}
                                    {isLiked ? <IoHeart size={20}/> : <IoHeartOutline size={20}/>}
                                    <span>{likeCount}</span>
                                </button>
                                <ShareApi
                                    shareData={{
                                        title: `[축제 정보] ${festival.title}`,
                                        text: festival.overview.replace(/<[^>]+>/g, ''),
                                        url: window.location.href,
                                        imageUrl: festival.firstimage, // 카카오톡 공유에 사용할 대표 이미지 전달
                                    }}
                                    className="icon-button"
                                >
                                    <IoShareSocialOutline size={22}/> {/* 아이콘 컴포넌트를 자식으로 전달 */}
                                </ShareApi>
                            </div>
                        </div>
                        <div className="info-content overview-content"
                             dangerouslySetInnerHTML={{__html: festival.overview}}/>
                    </div>

                    <div className="info-section">
                        <h2 className="section-title">정보</h2>
                        <ul className="detail-info-grid">
                            {information?.eventstartdate && (
                                <li className="info-card">
                                    <div className="info-card-icon"><IoCalendarOutline/></div>
                                    <div className="info-card-content">
                                        <span className="info-label">행사 기간</span>
                                        <div
                                            className="info-text">{`${information.eventstartdate.substring(0, 4)}.${information.eventstartdate.substring(4, 6)}.${information.eventstartdate.substring(6, 8)} ~ ${information.eventenddate.substring(0, 4)}.${information.eventenddate.substring(4, 6)}.${information.eventenddate.substring(6, 8)}`}</div>
                                    </div>
                                </li>
                            )}
                            {information?.playtime && (
                                <li className="info-card">
                                    <div className="info-card-icon"><IoTimeOutline/></div>
                                    <div className="info-card-content">
                                        <span className="info-label">공연 시간</span>
                                        <div className="info-text"
                                             dangerouslySetInnerHTML={{__html: information.playtime}}/>
                                    </div>
                                </li>
                            )}
                            {information?.usetimefestival && (
                                <li className="info-card">
                                    <div className="info-card-icon"><IoPricetagOutline/></div>
                                    <div className="info-card-content">
                                        <span className="info-label">티켓 / 금액</span>
                                        <div className="info-text"
                                             dangerouslySetInnerHTML={{__html: information.usetimefestival}}/>
                                    </div>
                                </li>
                            )}
                            {information?.sponsor1 && (
                                <li className="info-card">
                                    <div className="info-card-icon"><IoBusiness/></div>
                                    <div className="info-card-content">
                                        <span className="info-label">주최자 정보</span>
                                        <div className="info-text">{information.sponsor1}</div>
                                    </div>
                                </li>
                            )}
                            {festival.tel && (
                                <li className="info-card">
                                    <div className="info-card-icon"><IoCall/></div>
                                    <div className="info-card-content">
                                        <span className="info-label">주최자 전화번호</span>
                                        <div className="info-text">{festival.tel}</div>
                                    </div>
                                </li>
                            )}
                            {festival.homepage && (
                                <li className="info-card">
                                    <div className="info-card-icon"><IoLink/></div>
                                    <div className="info-card-content">
                                        <span className="info-label">웹사이트</span>
                                        <div className="info-text">
                                            <a href={festival.homepage.match(/href="([^"]*)"/)?.[1] || '#'}
                                               target="_blank" rel="noopener noreferrer">
                                                Visit Official Website
                                            </a>
                                        </div>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
                <aside className="sidebar">
                    <div className="sidebar-section">
                        {/*날씨 위젯*/}
                        {festival && <WeatherWidget lat={festival.mapy} lon={festival.mapx}/>}
                        <h3 className="sidebar-title"><IoPin/> 오시는 길</h3>
                        <p className="address-text">{festival.addr1}</p>
                        <div id="map" style={{width: '100%', height: '250px', borderRadius: '12px'}}></div>
                    </div>
                    <div className="sidebar-section">
                        <h3 className="sidebar-title">길찾기</h3>
                        <p className="sidebar-description">축제 여행을 계획해보세요.</p>
                        <button onClick={() => openDirectionsModal(festival)} className="primary-button">
                            축제 장소 길찾기
                        </button>
                        <div className="external-links">
                            <a href="https://www.kobus.co.kr/main.do" target="_blank" rel="noopener noreferrer"
                               className="link-card">
                                <IoBusOutline className="link-card-icon"/>
                                <span className="link-card-text">고속버스 예매</span>
                                <span className="link-card-arrow">→</span>
                            </a>
                            <a href="https://www.letskorail.com/" target="_blank" rel="noopener noreferrer"
                               className="link-card">
                                <IoTrainOutline className="link-card-icon"/>
                                <span className="link-card-text">기차 예매</span>
                                <span className="link-card-arrow">→</span>
                            </a>
                        </div>
                    </div>
                </aside>
                {foodList.length > 0 && (
                    <div className="nearby-food-section">
                        <h2 className="section-title"><IoFastFoodOutline/> 축제 주변 / 추천 맛집 리스트!</h2>
                        <ul className="food-grid-list">
                            {foodList.map(food => (
                                <li key={food.contentid} className="food-card">
                                    <div className="food-card-image-wrapper">
                                        {food.firstimage ? (
                                            <img src={food.firstimage} alt={food.title}
                                                 className="food-card-image"/>
                                        ) : (
                                            <div className="food-card-image placeholder"><IoFastFoodOutline/></div>
                                        )}
                                    </div>
                                    <div className="food-card-content">
                                        <h4 className="food-card-title">{food.title}</h4>
                                        <p className="food-card-meta">
                                            <IoLocationOutline/>
                                            <span>{food.addr1}</span>
                                        </p>
                                        <div className="food-card-footer">
                                            <span
                                                className="food-card-dist">약 {Math.round(Number(food.dist) / 1000 * 10) / 10} km</span>
                                            <button onClick={() => openDirectionsModal(food)}
                                                    className="food-card-route-button">
                                                길찾기
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {isModalOpen && selectedDestination && (
                    <div className="directions-modal-overlay" onClick={closeDirectionsModal}>
                        <div className="directions-modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>어떤 지도로 길을 찾으시겠어요?</h3>
                            <p className="modal-destination-title">{selectedDestination.title}</p>
                            <div className="modal-buttons">
                                <a
                                    href={`https://map.kakao.com/link/to/${selectedDestination.title},${selectedDestination.mapy},${selectedDestination.mapx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="modal-button kakao"
                                >
                                    카카오맵으로 길찾기
                                </a>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDestination.mapy},${selectedDestination.mapx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="modal-button google"
                                >
                                    구글맵으로 길찾기
                                </a>
                            </div>
                            <button onClick={closeDirectionsModal} className="modal-close-button">닫기</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailPage;