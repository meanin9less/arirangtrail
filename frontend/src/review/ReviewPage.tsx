import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
// ✨ CSS 모듈 임포트 경로 수정: ReviewPage.module.css를 사용하도록 명확히 합니다.
import styles from './Review.module.css';

// 데이터 모델 정의 (DB 스키마에 맞춰 업데이트)
interface Review {
    reviewId: string; // DB의 reviewid (bigint)
    username: string; // DB의 username
    contentId: string; // DB의 contentid (bigint)
    contentTitle: string; // DB의 contenttitle
    title: string; // DB의 title
    content: string; // DB의 content
    rating: number; // DB의 rating (decimal 2,1)
    visitDate?: string; // DB의 visitdate (date) - 선택 사항
    imageUrl?: string; // 단일 이미지 URL (reviewphotos에서 가져올 경우)
    caption?: string; // DB의 caption (reviewphotos에서 가져올 경우)
    createdAt: string;
    updatedAt: string;
}

interface GetReviewsResponse {
    reviews: Review[];
    message?: string;
}

function ReviewPage() {
    const navigate = useNavigate();
    const location = useLocation();

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
            // 백엔드에서 /reviews GET 요청 시 Review[] 배열을 포함하는 JSON을 반환해야 합니다.
            const response = await apiClient.get<GetReviewsResponse>('/reviews&page=0');
            setReviews(response.data.reviews || []); // reviews 배열이 없으면 빈 배열로 설정
            setMessage('리뷰를 성공적으로 가져왔습니다.');
            console.log("Reviews fetched successfully:", response.data.reviews); // 디버그 로그
        } catch (error: any) {
            console.error('리뷰 가져오기 오류:', error);
            let errorMessage = '리뷰를 가져오는 데 실패했습니다: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                // 백엔드에서 보낸 구체적인 에러 메시지 확인
                console.error("Backend error response:", error.response.data);
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
                        <div key={review.reviewId} className={styles.reviewItem}>
                            {/* 제목에 Link 추가 */}
                            <p className={styles.reviewTitleLink}>
                                <Link to={`/review/detail/${review.reviewId}`}>
                                    <strong>{review.title}</strong>
                                </Link>
                            </p>
                            <p><strong>작성자:</strong> {review.username}</p>
                            <p><strong>별점:</strong> {'⭐'.repeat(review.rating)}</p>
                            {/* 리뷰 내용의 일부만 표시 */}
                            <p className={styles.reviewContentPreview}>
                                {review.content.length > 100 ? review.content.substring(0, 100) + '...' : review.content}
                            </p>
                            {review.imageUrl && ( // 이미지 URL이 있을 경우 이미지 표시
                                <div className={styles.reviewImageContainer}>
                                    <img src={review.imageUrl} alt={review.caption || review.title} className={styles.reviewImage} />
                                    {review.caption && <p className={styles.imageCaption}>{review.caption}</p>}
                                </div>
                            )}
                            <p className={styles.reviewDate}>작성일: {new Date(review.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReviewPage;
