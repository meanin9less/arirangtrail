import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation 임포트
import styles from './Review.module.css';

// 데이터 모델 정의 (DB 스키마에 맞춰 업데이트)
interface Review {
    reviewid: string; // DB의 reviewid (bigint)
    username: string; // DB의 username
    contentid: string; // DB의 contentid (bigint)
    contenttitle: string; // DB의 contenttitle
    title: string; // DB의 title
    content: string; // DB의 content
    rating: number; // DB의 rating (decimal 2,1)
    visitdate?: string; // DB의 visitdate (date) - 선택 사항
    imageurl?: string; // 단일 이미지 URL (reviewphotos에서 가져올 경우)
    caption?: string; // DB의 caption (reviewphotos에서 가져올 경우)
    createdat: string;
    updatedat: string;
}

interface GetReviewsResponse {
    reviews: Review[];
    message?: string;
}

function ReviewPage() {
    const navigate = useNavigate();
    const location = useLocation(); // useLocation 훅 사용

    // 상태 관리
    const [reviews, setReviews] = useState<Review[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [fetchingReviews, setFetchingReviews] = useState<boolean>(true);

    // 컴포넌트가 처음 마운트되거나 location.pathname이 변경될 때 리뷰 목록을 가져옵니다.
    useEffect(() => {
        console.log("ReviewPage useEffect triggered. Fetching reviews..."); // 디버그 로그
        fetchReviews();
    }, [location.pathname]); // location.pathname을 의존성 배열에 추가

    const fetchReviews = async () => {
        setFetchingReviews(true);
        try {
            // [백엔드 연동 필요] 실제 API 엔드포인트
            const response = await apiClient.get<GetReviewsResponse>('/reviews');
            setReviews(response.data.reviews || []);
            setMessage('리뷰를 성공적으로 가져왔습니다.');
            console.log("Reviews fetched successfully:", response.data.reviews); // 디버그 로그
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

    // "글쓰기" 버튼 클릭 핸들러
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

            {/* "글쓰기" 버튼 추가 */}
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
                        <div key={review.reviewid} className={styles.reviewItem}> {/* reviewid 사용 */}
                            <p><strong>제목:</strong> {review.title}</p> {/* 리뷰 제목 표시 */}
                            <p><strong>행사:</strong> {review.contenttitle} (ID: {review.contentid})</p> {/* 행사 정보 표시 */}
                            <p><strong>작성자:</strong> {review.username}</p>
                            <p><strong>별점:</strong> {'⭐'.repeat(review.rating)}</p>
                            <p><strong>내용:</strong> {review.content}</p>
                            {review.visitdate && <p><strong>방문일:</strong> {review.visitdate}</p>} {/* 방문일 표시 */}
                            {review.imageurl && ( // 이미지 URL이 있을 경우 이미지 표시
                                <div className={styles.reviewImageContainer}>
                                    <img src={review.imageurl} alt={review.caption || review.title} className={styles.reviewImage} />
                                    {review.caption && <p className={styles.imageCaption}>{review.caption}</p>} {/* 이미지 캡션 표시 */}
                                </div>
                            )}
                            <p className={styles.reviewDate}>작성일: {new Date(review.createdat).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReviewPage;
