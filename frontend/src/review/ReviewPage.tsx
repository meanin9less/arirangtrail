import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './Review.module.css';

// ✨ 백엔드 ReviewResponseDto와 ReviewDetailPage의 Review 인터페이스에 맞춰 필드명 통일 및 추가
interface Review {
    reviewid: string; // id -> reviewid
    username: string; // userId -> username
    contentid?: string; // 추가: 축제/관광지 ID
    contenttitle?: string; // 추가: 축제/관광지 제목
    title: string; // 추가: 리뷰 제목
    content: string;
    rating: number;
    visitdate?: string; // 추가: 방문일
    imageurl?: string; // 추가: 이미지 URL
    caption?: string; // 추가: 이미지 캡션
    createdat: string; // createdAt -> createdat
    updatedat: string; // 추가: updatedat
}

// 리뷰 작성 시 보낼 데이터 (백엔드 ReviewCreateRequestDto에 맞춰야 함)
// 현재는 content와 rating만 있지만, 백엔드 DTO에 따라 title, contentId, visitDate 등을 추가해야 할 수 있습니다.
interface ReviewFormData {
    title: string; // ✨ 추가: 리뷰 제목
    content: string;
    rating: number;
    contentid?: string; // ✨ 추가: 축제/관광지 ID (선택 사항)
    visitdate?: string; // ✨ 추가: 방문일 (선택 사항)
    // imageurl 및 caption은 MultipartFile로 별도 전송되므로 여기서는 제외
}

interface PostReviewResponse {
    message: string;
    review?: Review; // 백엔드에서 생성된 리뷰 정보를 반환할 경우
}

interface GetReviewsResponse {
    reviews: Review[];
    message?: string;
}

function ReviewPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newReviewTitle, setNewReviewTitle] = useState<string>(''); // ✨ 추가: 새 리뷰 제목 상태
    const [newReviewContent, setNewReviewContent] = useState<string>('');
    const [newReviewRating, setNewReviewRating] = useState<number>(5);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchingReviews, setFetchingReviews] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [modalMessageType, setModalMessageType] = useState<'success' | 'error' | null>(null); // 모달 타입 추가

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setFetchingReviews(true);
        try {
            // 모든 리뷰 조회 엔드포인트 호출
            const response = await apiClient.get<GetReviewsResponse>('/api/reviews'); // ✨ API 경로 확인: /api/reviews
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

    // ✨ 새 리뷰 제목 변경 핸들러
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewReviewTitle(e.target.value);
    };

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNewReviewContent(e.target.value);
    };

    const handleRatingChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setNewReviewRating(Number(e.target.value));
    };

    const handleSubmitReview = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setMessage(null);
        setLoading(true);
        setModalMessageType(null); // 모달 타입 초기화

        if (!newReviewTitle.trim()) { // ✨ 제목 유효성 검사 추가
            setMessage('리뷰 제목을 입력해주세요.');
            setLoading(false);
            setModalMessage('리뷰 제목을 입력해주세요.');
            setModalMessageType('error');
            setShowModal(true);
            return;
        }
        if (!newReviewContent.trim()) {
            setMessage('리뷰 내용을 입력해주세요.');
            setLoading(false);
            setModalMessage('리뷰 내용을 입력해주세요.');
            setModalMessageType('error');
            setShowModal(true);
            return;
        }
        if (newReviewRating < 1 || newReviewRating > 5) {
            setMessage('별점은 1점에서 5점 사이로 입력해주세요.');
            setLoading(false);
            setModalMessage('별점은 1점에서 5점 사이로 입력해주세요.');
            setModalMessageType('error');
            setShowModal(true);
            return;
        }

        // ✨ 백엔드 ReviewCreateRequestDto에 맞춰 데이터 구성
        const reviewData: ReviewFormData = {
            title: newReviewTitle,
            content: newReviewContent,
            rating: newReviewRating,
            // contentid, visitdate 등 추가 필드가 있다면 여기에 포함
        };

        try {
            // 리뷰 작성 엔드포인트 호출
            const response = await apiClient.post<PostReviewResponse>('/api/reviews', reviewData); // ✨ API 경로 확인: /api/reviews

            const successMsg = response.data.message || '리뷰가 성공적으로 작성되었습니다!';
            setMessage(successMsg);
            setModalMessage(successMsg);
            setModalMessageType('success');
            setShowModal(true);

            setNewReviewTitle(''); // ✨ 제목 필드 초기화
            setNewReviewContent('');
            setNewReviewRating(5);

            fetchReviews(); // 리뷰 목록 새로고침

        } catch (error: any) {
            console.error('리뷰 작성 오류:', error);
            let errorMessage = '리뷰 작성에 실패했습니다: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.message || '리뷰 작성 실패: 서버 오류';
            }
            setMessage(errorMessage);
            setModalMessage(errorMessage);
            setModalMessageType('error');
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        setModalMessageType(null);
    };

    return (
        <div className={styles.reviewContainer}>
            <h2>사용자 리뷰</h2>

            {message && (
                <p className={message.includes('성공') ? styles.successMessage : styles.errorMessage}>
                    {message}
                </p>
            )}

            <h3 className={styles.sectionTitle}>모든 리뷰 ({reviews.length})</h3>
            {fetchingReviews ? (
                <p>리뷰를 불러오는 중...</p>
            ) : reviews.length === 0 ? (
                <p>아직 작성된 리뷰가 없습니다. 첫 리뷰를 작성해주세요!</p>
            ) : (
                <div className={styles.reviewList}>
                    {reviews.map(review => (
                        // ✨ reviewid를 key로 사용하고, Link를 통해 상세 페이지로 이동
                        <div key={review.reviewid} className={styles.reviewItem}>
                            <h4 className={styles.reviewItemTitle}>
                                <a href={`/reviews/${review.reviewid}`}>{review.title}</a> {/* ✨ 상세 페이지 링크 */}
                            </h4>
                            <p><strong>작성자:</strong> {review.username}</p>
                            <p><strong>별점:</strong> {'⭐'.repeat(review.rating)}</p>
                            {review.contenttitle && ( // ✨ 축제/관광지 제목 표시 (선택 사항)
                                <p><strong>관련 행사:</strong> {review.contenttitle}</p>
                            )}
                            <p><strong>내용:</strong> {review.content.length > 100 ? review.content.substring(0, 100) + '...' : review.content}</p> {/* 내용 미리보기 */}
                            {review.imageurl && ( // ✨ 이미지 미리보기 (선택 사항)
                                <img src={review.imageurl} alt={review.caption || review.title} className={styles.reviewThumbnail} />
                            )}
                            <p className={styles.reviewDate}>작성일: {new Date(review.createdat).toLocaleString()}</p>
                            {review.updatedat && review.createdat !== review.updatedat && ( // ✨ 수정일 표시 (선택 사항)
                                <p className={styles.reviewDate}>수정일: {new Date(review.updatedat).toLocaleString()}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 새 리뷰 작성 폼 */}
            <h3 className={styles.sectionTitle}>새 리뷰 작성</h3>
            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                <div>
                    <label htmlFor="reviewTitle">리뷰 제목:</label> {/* ✨ 제목 입력 필드 추가 */}
                    <input
                        type="text"
                        id="reviewTitle"
                        value={newReviewTitle}
                        onChange={handleTitleChange}
                        required
                        className={styles.inputField}
                        placeholder="리뷰 제목을 입력해주세요."
                    />
                </div>
                <div>
                    <label htmlFor="reviewContent">리뷰 내용:</label>
                    <textarea
                        id="reviewContent"
                        value={newReviewContent}
                        onChange={handleContentChange}
                        required
                        rows={4}
                        className={styles.textareaField}
                        placeholder="리뷰 내용을 입력해주세요."
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="reviewRating">별점:</label>
                    <select
                        id="reviewRating"
                        value={newReviewRating}
                        onChange={handleRatingChange}
                        required
                        className={styles.selectField}
                    >
                        {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}점</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                >
                    {loading ? '리뷰 작성 중...' : '리뷰 작성'}
                </button>
            </form>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>알림</h3>
                        <p className={modalMessageType === 'success' ? styles.successMessage : styles.errorMessage}>
                            {modalMessage}
                        </p>
                        <button
                            onClick={handleCloseModal}
                            className={styles.modalButton}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReviewPage;
