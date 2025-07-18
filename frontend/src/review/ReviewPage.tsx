import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✨ useNavigate 훅 임포트
import styles from './Review.module.css'; // CSS 모듈 임포트

// 데이터 모델 정의
interface Review {
    id: string;
    userId: string;
    content: string;
    rating: number;
    createdAt: string;
}

interface GetReviewsResponse {
    reviews: Review[];
    message?: string;
}

function ReviewPage() {
    const navigate = useNavigate(); // ✨ useNavigate 훅 초기화

    // 상태 관리
    const [reviews, setReviews] = useState<Review[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [fetchingReviews, setFetchingReviews] = useState<boolean>(true);

    // 컴포넌트가 처음 마운트될 때 리뷰 목록을 가져옵니다.
    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setFetchingReviews(true);
        try {
            const response = await apiClient.get<GetReviewsResponse>('/reviews'); // 백엔드 API 엔드포인트
            setReviews(response.data.reviews || []);
            setMessage('리뷰를 성공적으로 가져왔습니다.');
        } catch (error: any) {
            console.error('리뷰 가져오기 오류:', error);
            let errorMessage = '리뷰를 가져오는 데 실패했습니다: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.message || '리뷰 가져오기 실패: 서버 오류';
            }
            setMessage(errorMessage);
        } finally {
            setFetchingReviews(false);
        }
    };

    // ✨ "글쓰기" 버튼 클릭 핸들러
    const handleWriteReviewClick = () => {
        navigate('/review/write'); // 새 리뷰 작성 페이지로 이동
    };

    return (
        <div className={styles.reviewContainer}>
            <h2>사용자 리뷰</h2>

            {message && (
                <p className={message.includes('성공') ? styles.successMessage : styles.errorMessage}>
                    {message}
                </p>
            )}

            {/* ✨ "글쓰기" 버튼 추가 */}
            <div className={styles.writeButtonContainer}>
                <button onClick={handleWriteReviewClick} className={styles.writeReviewButton}>
                    글쓰기
                </button>
            </div>

            {/* 리뷰 목록 표시 */}
            <h3 className={styles.sectionTitle}>모든 리뷰 ({reviews.length})</h3>
            {fetchingReviews ? (
                <p>리뷰를 불러오는 중...</p>
            ) : reviews.length === 0 ? (
                <p>아직 작성된 리뷰가 없습니다. 첫 리뷰를 작성해주세요!</p>
            ) : (
                <div className={styles.reviewList}>
                    {reviews.map(review => (
                        <div key={review.id} className={styles.reviewItem}>
                            <p><strong>작성자:</strong> {review.userId}</p>
                            <p><strong>별점:</strong> {'⭐'.repeat(review.rating)}</p>
                            <p><strong>내용:</strong> {review.content}</p>
                            <p className={styles.reviewDate}>작성일: {new Date(review.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ✨ 새 리뷰 작성 폼 제거됨 (ReviewWritePage.tsx로 이동) */}
        </div>
    );
}

export default ReviewPage;
