import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './MyReviewsPage.module.css'; // MyReviewsPage 전용 스타일 파일 임포트

// 1. StarRating 컴포넌트 (별점 표시용)
interface StarRatingProps {
    rating: number; // 현재 별점 (0.5 단위 가능)
    maxStars?: number; // 최대 별 개수
    size?: string; // 별 아이콘 크기 (예: 'w-5 h-5')
    readOnly?: boolean; // 읽기 전용 모드 여부
}

const StarRating: React.FC<StarRatingProps> = ({
                                                   rating,
                                                   maxStars = 5,
                                                   size = 'w-5 h-5',
                                                   readOnly = true, // MyReviewsPage에서는 항상 읽기 전용
                                               }) => {
    return (
        <div className="flex items-center">
            {[...Array(maxStars)].map((_, index) => (
                <svg
                    key={index}
                    className={`${size} ${
                        rating >= index + 1
                            ? 'text-yellow-400'
                            : rating >= index + 0.5
                                ? 'text-yellow-400 opacity-50' // 반쪽 별 표현
                                : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.832 5.626h5.912c.969 0 1.371 1.24.588 1.81l-4.78 3.48.588 5.626c.17.969-.882 1.728-1.748 1.185L10 16.147l-4.78 3.48c-.866.543-1.918-.17-1.748-1.185l.588-5.626-4.78-3.48c-.783-.57-.381-1.81.588-1.81h5.912l1.832-5.626z" />
                </svg>
            ))}
        </div>
    );
};

// 백엔드에서 받아올 리뷰 사진 DTO 인터페이스
interface ReviewPhotoResponseDto {
    photoId: number;
    photoUrl: string;
}

// ReviewItem 컴포넌트가 받을 props 인터페이스
interface DisplayReviewItemProps {
    review: {
        id: string; // reviewId
        author: string; // username
        rating: number; // rating
        comment: string; // content (리뷰 내용)
        date: string; // createdAt (작성일)
        contentTitle: string; // 축제/관광지 이름
        reviewTitle: string; // 리뷰 제목
        visitDate: string; // 방문 일자
        photos: ReviewPhotoResponseDto[]; // 사진 목록
    };
    onReviewClick: (reviewId: string) => void; // 리뷰 제목 클릭 핸들러
}

const ReviewItem: React.FC<DisplayReviewItemProps> = ({ review, onReviewClick }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 cursor-pointer"
             onClick={() => onReviewClick(review.id)}> {/* 전체 아이템 클릭 가능하게 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{review.author}</h4>
                <StarRating rating={review.rating} size="w-4 h-4" />
            </div>
            <p className="text-gray-700 font-medium mb-1">
                <span className="text-blue-600">[{review.contentTitle}]</span>{' '}
                <span className="hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onReviewClick(review.id); }}>
          {review.reviewTitle}
        </span>
            </p>
            <p className="text-gray-700 mb-2 line-clamp-2">{review.comment}</p> {/* 내용 미리보기 */}

            {/* 리뷰 사진 표시 */}
            {review.photos && review.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 mb-2">
                    {review.photos.slice(0, 3).map((photo) => ( // 최대 3장까지만 미리보기
                        <img
                            key={photo.photoId}
                            src={photo.photoUrl}
                            alt="리뷰 사진"
                            className="w-16 h-16 object-cover rounded-md border border-gray-300"
                        />
                    ))}
                    {review.photos.length > 3 && (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-500 text-xs rounded-md border border-gray-300">
                            +{review.photos.length - 3}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between text-sm text-gray-500">
                <span>방문일: {review.visitDate}</span>
                <span>작성일: {review.date}</span>
            </div>
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
        <div className="space-y-4">
            {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} onReviewClick={onReviewClick} />
            ))}
        </div>
    );
};

// 백엔드에서 받아올 리뷰 데이터 인터페이스
interface BackendReview {
    reviewId: number;
    username: string;
    contentId: string;
    contentTitle: string; // 축제/관광지 이름
    title: string; // 리뷰 제목
    content: string; // 리뷰 내용
    rating: number; // 평점 (예: 4.5)
    visitDate: string; // 방문 일자 (YYYY-MM-DD)
    createdAt: string; // 작성 일자 (ISO 8601)
    photos: ReviewPhotoResponseDto[]; // 사진 목록 추가
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
            const formattedReviews: DisplayReviewItemProps['review'][] = response.data.map(review => ({
                id: String(review.reviewId),
                author: review.username,
                rating: review.rating,
                comment: review.content,
                date: review.createdAt.substring(0, 10),
                contentTitle: review.contentTitle,
                reviewTitle: review.title,
                visitDate: review.visitDate,
                photos: review.photos || [],
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
    }, [jwtToken, isLoggedIn, navigate]); // isLoggedIn과 navigate를 의존성 배열에 추가

    useEffect(() => {
        // 컴포넌트 마운트 시 로그인 여부 확인 및 API 호출
        if (!isLoggedIn) {
            navigate('/login'); // 로그인되지 않았다면 로그인 페이지로 리디렉션
            return;
        }
        fetchMyReviews(); // 로그인되어 있다면 리뷰 데이터 호출
    }, [isLoggedIn, navigate, fetchMyReviews]); // isLoggedIn, navigate, fetchMyReviews가 변경될 때마다 실행

    // 리뷰 클릭 시 상세 페이지로 이동
    const handleReviewClick = (reviewId: string) => {
        // ✨ 기존 라우팅 경로에 맞춰 수정
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
