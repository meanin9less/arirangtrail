import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './ReviewDetailPage.module.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './swiper-custom.css'; // ReviewPage와 동일한 CSS 재사용
import { Navigation, Pagination } from 'swiper/modules';

import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Photo {
    photoId: number,
    photoUrl: string
}

// 데이터 모델 정의 (ReviewPage.tsx와 동일하게 유지)
interface Review {
    reviewId: string;
    username: string;
    contentId: string;
    contentTitle: string;
    title: string;
    content: string;
    rating: number;
    visitDate?: string;
    photos?: Photo[]; // 단일 이미지 URL (reviewphotos에서 가져올 경우)
    caption?: string;
    createdAt: string;
    updatedAt: string;
}

function ReviewDetailPage() {
    const { reviewId } = useParams<{ reviewId: string }>(); // URL에서 reviewId 가져오기
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.token.userProfile?.username);

    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    console.log(reviewId);
    useEffect(() => {
        if (!reviewId) {
            setError('리뷰 ID가 제공되지 않았습니다.');
            setLoading(false);
            return;
        }
        const fetchReviewDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                // [백엔드 연동 필요] 단일 리뷰를 가져오는 API 엔드포인트
                // 예: GET /reviews/{reviewId}
                const response = await apiClient.get(`/reviews/${reviewId}`);
                setReview(response.data);
            } catch (err: any) {
                console.error(`리뷰 상세 정보 불러오기 오류 (ID: ${reviewId}):`, err);
                let errorMessage = '리뷰 상세 정보를 불러오는 데 실패했습니다.';
                if (axios.isAxiosError(err) && err.response) {
                    errorMessage = err.response.data?.message || errorMessage;
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchReviewDetail();
    }, []); // reviewId가 변경될 때마다 다시 불러오기

    if (loading) {
        return (
            <div className={styles.detailContainer}>
                <p>리뷰를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.detailContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button onClick={() => navigate('/review')} className={styles.backButton}>
                    리뷰 목록으로 돌아가기
                </button>
            </div>
        );
    }

    if (!review) {
        return (
            <div className={styles.detailContainer}>
                <p>리뷰를 찾을 수 없습니다.</p>
                <button onClick={() => navigate('/review')} className={styles.backButton}>
                    리뷰 목록으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className={styles.detailContainer}>
            <h2 className={styles.reviewTitle}>{review.title}</h2>

            {review.photos && review.photos.length > 0 && (
                <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation
                    pagination={{ clickable: true }}
                    className={styles.detailSwiper}
                >
                    {review.photos.map(photo => (
                        <SwiperSlide key={photo.photoId}>
                            <img src={photo.photoUrl} alt={review.caption || review.title} className={styles.detailImage} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}

            <div className={styles.reviewDetailsGroup}>
                <div className={styles.reviewDetailsLine}>
                    <p className={styles.reviewDetailItem}>작성자: <strong>{review.username}</strong></p>
                    <p className={styles.reviewDetailItem}>별점: ⭐ {review.rating}</p>
                </div>
                {(review.contentTitle || review.visitDate) && (
                    <div className={styles.reviewDetailsLine}>
                        {review.contentTitle && (
                            <p className={styles.reviewDetailItem}>행사: {review.contentTitle} (ID: {review.contentId})</p>
                        )}
                        {review.visitDate && (
                            <p className={styles.reviewDetailItem}>방문일: {review.visitDate}</p>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.reviewContent}>
                <p>{review.content}</p>
            </div>

            <p className={styles.reviewDate}>
                작성일: {new Date(review.createdAt).toLocaleString()}
            </p>
            <p className={styles.reviewDate}>
                최종 수정일: {new Date(review.updatedAt).toLocaleString()}
            </p>

            <button onClick={() => navigate('/review')} className={styles.backButton}>
                목록으로
            </button>
            {currentUser === review.username && (
                <div className={styles.actionButtons}>
                    <button onClick={() => navigate(`/review/update/${reviewId}`)} className={styles.editButton}>
                        수정
                    </button>
                    <button onClick={async () => {
                        await apiClient.delete(`/reviews/${reviewId}`);
                        navigate(`/review`);
                    }} className={styles.editButton}>
                        삭제
                    </button>
                </div>
            )}
        </div>
    );
}

export default ReviewDetailPage;
