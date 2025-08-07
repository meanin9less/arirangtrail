import React, {useState, useEffect, useCallback, useRef} from 'react';
import apiClient from '../api/axiosInstance';
import {useNavigate, Link} from 'react-router-dom';
import styles from './Review.module.css';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './swiper-custom.css';
import {Navigation, Pagination} from 'swiper/modules';
import {useSelector} from "react-redux";
import {RootState} from "../store";

interface Photo {
    photoId: number;
    photoUrl: string;
}

interface Review {
    reviewId: string;
    username: string;
    contentId: string;
    contentTitle: string;
    title: string;
    content: string;
    rating: number;
    visitDate?: string;
    photos?: Photo[];
    caption?: string;
    createdAt: string;
    updatedAt: string;
}

// 백엔드의 ReviewListResponseDto와 일치하는 인터페이스
interface GetReviewsResponse {
    reviews: Review[];
}

function ReviewPage() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0); // 현재 페이지 번호
    const [hasMore, setHasMore] = useState<boolean>(true); // 더 불러올 데이터가 있는지 여부
    const loader = useRef<HTMLDivElement | null>(null); // Intersection Observer를 위한 ref

    const fetchReviews = useCallback(async () => {
        if (loading || !hasMore) return; // 이미 로딩 중이거나 더 이상 데이터가 없으면 실행하지 않음
        setLoading(true);
        try {
            // 페이지 번호를 사용하여 데이터 요청
            const response = await apiClient.get<GetReviewsResponse>(`/reviews?page=${page}`);
            const newReviews = response.data.reviews || [];

            setReviews(prevReviews => [...prevReviews, ...newReviews]); // 기존 리뷰에 새로운 리뷰 추가
            setHasMore(newReviews.length === 20); // 백엔드에서 20개씩 보내주므로, 20개 미만이면 더 이상 데이터가 없음
            setPage(prevPage => prevPage + 1); // 다음 페이지로 설정

        } catch (error) {
            console.error('리뷰 가져오기 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore]);

    // Intersection Observer를 사용하여 스크롤 감지
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchReviews();
                }
            },
            {threshold: 1.0}
        );

        const currentLoader = loader.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loader, fetchReviews]);


    const currentUser = useSelector((state: RootState) => state.token.userProfile);

    const handleWriteReviewClick = () => {
        if (!currentUser) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }
        navigate('/review/write');
    };

    return (
        <div className={styles.reviewContainer}>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>축제 후기</h2>
                <p className={styles.pageDescription}>다양한 축제를 즐기고 생생한 후기를 공유해보세요!</p>
            </div>

            <div className={styles.reviewHeader}>
                <h3 className={styles.sectionTitle}>모든 리뷰 ({reviews.length})</h3>
                <button onClick={handleWriteReviewClick} className={styles.writeReviewButton}>
                    글쓰기
                </button>
            </div>
            {reviews.length === 0 && !loading ? (
                <p>아직 작성된 리뷰가 없습니다. 첫 리뷰를 작성해주세요!</p>
            ) : (
                <div className={styles.reviewList}>
                    {reviews.map(review => (
                        <div key={review.reviewId} className={styles.reviewItem}>
                            {review.photos && review.photos.length > 0 ? (
                                <Swiper
                                    modules={[Navigation, Pagination]}
                                    spaceBetween={50}
                                    slidesPerView={1}
                                    navigation
                                    pagination={{clickable: true}}
                                    className="review-swiper"
                                >
                                    {review.photos.map(photo => (
                                        <SwiperSlide key={photo.photoId}>
                                            <img src={photo.photoUrl} alt={review.caption || review.title}
                                                 className={styles.reviewImage}/>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <div className={styles.reviewImage} style={{
                                    backgroundColor: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ccc'
                                }}>
                                    <span>No Image</span>
                                </div>
                            )}
                            <div className={styles.reviewInfo}>
                                <p className={styles.reviewTitleLink}>
                                    <Link to={`/review/detail/${review.reviewId}`}>
                                        <strong>{review.title}</strong>
                                    </Link>
                                </p>
                                <Link to={'/calender/' + review.contentId}
                                      className={styles.reviewContentLink}>{review.contentTitle}</Link>
                                <div className={styles.reviewMeta}>
                                    <span>{review.username}</span>
                                    <span>⭐ {review.rating}</span>
                                </div>
                                <p className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 로딩 인디케이터 및 Observer 타겟 */}
            <div ref={loader} className={styles.loader}>
                {loading && <p>리뷰를 불러오는 중...</p>}
            </div>
        </div>
    );
}

export default ReviewPage;
