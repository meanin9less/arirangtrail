import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './MyReviewsPage.module.css'; // MyReviewsPage 전용 스타일 파일 임포트

// ReviewItem 컴포넌트가 받을 props 인터페이스
interface DisplayReviewItemProps {
    review: {
        id: string; // reviewId
        // author: string; // 작성자 이름은 이제 목록에 표시하지 않음
        // rating: number; // 별점은 이제 목록에 표시하지 않음
        // comment: string; // 리뷰 내용은 이제 목록에 표시하지 않음
        date: string; // createdAt (작성일)
        // contentTitle: string; // 축제/관광지 이름은 이제 목록에 표시하지 않음
        reviewTitle: string; // 리뷰 제목
        // visitDate: string; // 방문 일자는 이제 목록에 표시하지 않음
        // photos: ReviewPhotoResponseDto[]; // 사진 목록은 이제 목록에 표시하지 않음
    };
    onReviewClick: (reviewId: string) => void; // 리뷰 제목 클릭 핸들러
}

const ReviewItem: React.FC<DisplayReviewItemProps> = ({ review, onReviewClick }) => {
    return (
        <div className={styles.reviewItem} onClick={() => onReviewClick(review.id)}>
            <Link to={`/review/detail/${review.id}`} className={styles.reviewTitleLink} onClick={(e) => e.stopPropagation()}>
                {review.reviewTitle}
            </Link>
            <span className={styles.reviewDate}>{review.date}</span>
        </div>
    );
};

// 3. ReviewList 컴포넌트
interface ReviewListProps {
    reviews: DisplayReviewItemProps['review'][];
    onReviewClick: (reviewId: string) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, onReviewClick }) => {
    if (reviews.length === 0) {
        return <p className="text-center text-gray-600 py-8">아직 작성한 리뷰가 없습니다.</p>;
    }

    return (
        <div className={styles.reviewList}>
            {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} onReviewClick={onReviewClick} />
            ))}
        </div>
    );
};

// 백엔드에서 받아올 리뷰 데이터 인터페이스 (필요한 모든 필드 유지)
interface BackendReview {
    reviewId: number;
    username: string; // author
    contentId: number; // for /calender/:festivalId link (if needed elsewhere)
    contentTitle: string; // for /calender/:festivalId link (if needed elsewhere)
    title: string; // reviewTitle
    content: string; // comment
    rating: number; // rating
    visitDate: string; // visitDate
    createdAt: string; // date
    photos: { photoId: number; photoUrl: string; }[]; // photos
}

const MyReviewsPage: React.FC = () => {
    const navigate = useNavigate();
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken; // 로그인 여부 확인

    const [reviews, setReviews] = useState<DisplayReviewItemProps['review'][]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 내 리뷰를 불러오는 함수 (useCallback으로 최적화)
    const fetchMyReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 로그인 상태가 아니면 API 호출을 하지 않고 로그인 페이지로 리디렉션
            if (!isLoggedIn) {
                navigate('/login'); // 로그인되지 않았다면 로그인 페이지로 리디렉션
                return; // 여기서 함수 실행 중단
            }

            const response = await apiClient.get<BackendReview[]>('/reviews/my', {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            });
            // 백엔드에서 받아온 모든 데이터를 DisplayReviewItemProps['review'] 형식에 맞게 매핑
            const formattedReviews: DisplayReviewItemProps['review'][] = response.data.map(review => ({
                id: String(review.reviewId),
                // author: review.username, // 이제 목록에 표시하지 않음
                // rating: review.rating, // 이제 목록에 표시하지 않음
                // comment: review.content, // 이제 목록에 표시하지 않음
                date: review.createdAt.substring(0, 10), // YYYY-MM-DD 형식
                // contentId: String(review.contentId), // 이제 목록에 표시하지 않음
                // contentTitle: review.contentTitle, // 이제 목록에 표시하지 않음
                reviewTitle: review.title,
                // visitDate: review.visitDate, // 이제 목록에 표시하지 않음
                // photos: review.photos || [], // 이제 목록에 표시하지 않음
            }));
            setReviews(formattedReviews);
        } catch (err: any) {
            console.error('내 리뷰 불러오기 오류:', err);
            let errorMessage = '내 리뷰를 불러오는 데 실패했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [jwtToken, isLoggedIn, navigate]);

    useEffect(() => {
        fetchMyReviews();
    }, [fetchMyReviews]);

    // 리뷰 클릭 시 상세 페이지로 이동
    const handleReviewClick = (reviewId: string) => {
        navigate(`/review/detail/${reviewId}`);
    };

    // 로딩 중 UI
    if (loading) {
        return (
            <div className={styles.container}>
                <p className={styles.message}>내 리뷰를 불러오는 중입니다...</p>
            </div>
        );
    }

    // 에러 발생 시 UI
    if (error) {
        return (
            <div className={styles.container}>
                <p className={`${styles.message} ${styles.errorMessage}`}>{error}</p>
            </div>
        );
    }

    // 모든 처리가 완료된 후 실제 리뷰 목록 UI
    return (
        <div className={styles.container}>
            <h2 className={styles.pageTitle}>내가 쓴 리뷰</h2>
            <button onClick={() => navigate('/mypage')} className={styles.backButton}>
                마이페이지로 돌아가기
            </button>
            <ReviewList reviews={reviews} onReviewClick={handleReviewClick} />
        </div>
    );
};

export default MyReviewsPage;
