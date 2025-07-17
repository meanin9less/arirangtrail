import React, {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";
import {Swiper, SwiperSlide} from "swiper/react";
import {Navigation, Pagination} from "swiper/modules";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
                            contentId: festivalId,
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
                }
            };
            fetchImages();
        }
    }, [festivalId]);

    if (!festival) {
        return <div>해당 축제 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="detail-page-container">
            <h1>{festival.title}</h1>
            <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={10}
                slidesPerView={1}
                navigation
                pagination={{clickable: true}}
                style={{marginBottom: "30px"}}
            >
                <SwiperSlide>
                    <img src={festival.firstimage} alt={festival.title}/>
                </SwiperSlide>
                {images.map(image => (
                    <SwiperSlide key={image.serialnum}>
                        <img src={image.originimgurl} alt={image.imgname}/>
                    </SwiperSlide>
                ))}

            </Swiper>

            <img src={festival.firstimage} alt={festival.title} style={{maxWidth: "100%", borderRadius: "8px"}}/>

            <h2>기본 정보</h2>
            <ul>
                <li><strong>주소:</strong> {festival.addr1} {festival.addr2}</li>
                <li><strong>연락처:</strong> {festival.tel}</li>
            </ul>

            <h2>축제 소개</h2>
            <div dangerouslySetInnerHTML={{__html: festival.overview}}/>

            홈페이지:{" "}
            <div
                dangerouslySetInnerHTML={{__html: festival.homepage}}
            />
            {/*{festival.mapx}*/}
            {/*{festival.mapy}*/}
        </div>
    );
}

export default DetailPage;