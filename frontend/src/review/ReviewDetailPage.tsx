import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './ReviewDetailPage.module.css'; // ✨ 새 CSS 모듈 임포트

// 데이터 모델 정의 (ReviewPage.tsx와 동일하게 유지)
interface Review {
    reviewid: string;
    username: string;
    contentid: string;
    contenttitle: string;
    title: string;
    content: string;
    rating: number;
    visitdate?: string;
    imageurl?: string;
    caption?: string;
    createdat: string;
    updatedat: string;
}

function ReviewDetailPage() {
    const { reviewId } = useParams<{ reviewId: string }>(); // URL에서 reviewId 가져오기
    const navigate = useNavigate();

    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                const response = await apiClient.get<Review>(`/reviews/${reviewId}`);
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
    }, [reviewId]); // reviewId가 변경될 때마다 다시 불러오기

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
            <p className={styles.reviewMeta}>
                작성자: <strong>{review.username}</strong> | 별점: {'⭐'.repeat(review.rating)}
            </p>
            {review.contenttitle && (
                <p className={styles.reviewMeta}>
                    행사: {review.contenttitle} (ID: {review.contentid})
                </p>
            )}
            {review.visitdate && (
                <p className={styles.reviewMeta}>방문일: {review.visitdate}</p>
            )}

            <div className={styles.reviewContent}>
                <p>{review.content}</p>
            </div>

            {review.imageurl && (
                <div className={styles.reviewImageContainer}>
                    <img src={review.imageurl} alt={review.caption || review.title} className={styles.reviewImage} />
                    {review.caption && <p className={styles.imageCaption}>{review.caption}</p>}
                </div>
            )}

            <p className={styles.reviewDate}>
                작성일: {new Date(review.createdat).toLocaleString()}
            </p>
            <p className={styles.reviewDate}>
                최종 수정일: {new Date(review.updatedat).toLocaleString()}
            </p>

            <button onClick={() => navigate('/review')} className={styles.backButton}>
                목록으로 돌아가기
            </button>
        </div>
    );
}

export default ReviewDetailPage;
