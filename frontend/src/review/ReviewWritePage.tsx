import React, { useState, ChangeEvent, FormEvent } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ReviewWrite.module.css'; // ✨ 새 CSS 모듈 임포트

// 데이터 모델 정의 (ReviewPage.tsx와 동일)
interface Review {
    id: string;
    userId: string;
    content: string;
    rating: number;
    createdAt: string;
}

interface ReviewFormData {
    content: string;
    rating: number;
}

interface PostReviewResponse {
    message: string;
    review?: Review;
}

function ReviewWritePage() {
    const navigate = useNavigate();

    // 상태 관리
    const [newReviewContent, setNewReviewContent] = useState<string>('');
    const [newReviewRating, setNewReviewRating] = useState<number>(5);
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null); // 메시지 타입 추가

    // 입력 필드 값 변경 핸들러
    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNewReviewContent(e.target.value);
    };

    const handleRatingChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setNewReviewRating(Number(e.target.value));
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        if (messageType === 'success') {
            navigate('/review'); // 성공 시 리뷰 목록 페이지로 돌아가기
        }
    };

    // 리뷰 제출 핸들러 (POST 요청)
    const handleSubmitReview = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setModalMessage('');
        setMessageType(null);

        // 클라이언트 측 유효성 검사
        if (!newReviewContent.trim()) {
            setModalMessage('리뷰 내용을 입력해주세요.');
            setMessageType('error');
            setShowModal(true);
            setLoading(false);
            return;
        }
        if (newReviewRating < 1 || newReviewRating > 5) {
            setModalMessage('별점은 1점에서 5점 사이로 입력해주세요.');
            setMessageType('error');
            setShowModal(true);
            setLoading(false);
            return;
        }

        const reviewData: ReviewFormData = {
            content: newReviewContent,
            rating: newReviewRating,
        };

        try {
            // POST 요청으로 새로운 리뷰를 서버에 보냅니다.
            const response = await apiClient.post<PostReviewResponse>('/reviews', reviewData); // 백엔드 API 엔드포인트

            const successMsg = response.data.message || '리뷰가 성공적으로 작성되었습니다!';
            setModalMessage(successMsg);
            setMessageType('success');
            setShowModal(true);

            setNewReviewContent(''); // 폼 초기화
            setNewReviewRating(5);   // 폼 초기화

        } catch (error: any) {
            console.error('리뷰 작성 오류:', error);
            let errorMessage = '리뷰 작성에 실패했습니다: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.message || '리뷰 작성 실패: 서버 오류';
            }
            setModalMessage(errorMessage);
            setMessageType('error');
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.reviewWriteContainer}>
            <h2>새 리뷰 작성</h2>

            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="reviewContent">리뷰 내용:</label>
                    <textarea
                        id="reviewContent"
                        value={newReviewContent}
                        onChange={handleContentChange}
                        required
                        rows={6} // 더 넓은 텍스트 영역
                        className={styles.textareaField}
                        placeholder="솔직한 리뷰를 남겨주세요."
                    ></textarea>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="reviewRating">별점:</label>
                    <select
                        id="reviewRating"
                        value={newReviewRating}
                        onChange={handleRatingChange}
                        required
                        className={styles.selectField}
                    >
                        {[5, 4, 3, 2, 1].map(num => ( // 5점부터 내림차순으로 표시
                            <option key={num} value={num}>{num}점</option>
                        ))}
                    </select>
                </div>
                <div className={styles.buttonContainer}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? '작성 중...' : '리뷰 제출'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/review')} // 취소 버튼 클릭 시 리뷰 목록으로 돌아가기
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                </div>
            </form>

            {/* 커스텀 모달 컴포넌트 */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>알림</h3>
                        <p className={messageType === 'success' ? styles.successMessage : styles.errorMessage}>
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

export default ReviewWritePage;
