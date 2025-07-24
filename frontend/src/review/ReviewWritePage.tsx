import React, { useState, ChangeEvent, FormEvent } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ReviewWrite.module.css'; // CSS 모듈 임포트 경로 변경

// 데이터 모델 정의 (DB 스키마에 맞춰 업데이트 - 불필요한 필드 제거)
interface Review {
    reviewid: string; // DB의 reviewid (bigint)
    username: string; // DB의 username
    title: string; // DB의 title
    content: string; // DB의 content
    rating: number; // DB의 rating (decimal 2,1)
    visitdate?: string; // DB의 visitdate (date) - 선택 사항
    imageurl?: string; // 단일 이미지 URL (reviewphotos에서 가져올 경우)
    caption?: string; // DB의 caption (reviewphotos에서 가져올 경우)
    createdat: string;
    updatedat: string;
}

interface ReviewFormData {
    // FormData로 보낼 필드들 (텍스트 데이터 - 불필요한 필드 제거)
    username: string; // 작성자 ID (현재는 임시, 실제로는 백엔드에서 인증된 사용자 ID 사용)
    title: string;
    content: string;
    rating: number;
    caption?: string; // 이미지 캡션 (선택 사항)
}

interface PostReviewResponse {
    message: string;
    review?: Review;
}

function ReviewWritePage() {
    const navigate = useNavigate();

    // 상태 관리 (DB 스키마 필드에 맞춰 추가 - 불필요한 필드 제거)
    const [reviewTitle, setReviewTitle] = useState<string>(''); // 리뷰 제목
    const [newReviewContent, setNewReviewContent] = useState<string>(''); // 리뷰 내용
    const [newReviewRating, setNewReviewRating] = useState<number>(5); // 별점
    const [imageCaption, setImageCaption] = useState<string>(''); // 이미지 캡션

    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    // 이미지 파일 관련 상태
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    // 입력 필드 값 변경 핸들러
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setReviewTitle(e.target.value);
    };
    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNewReviewContent(e.target.value);
    };
    const handleRatingChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setNewReviewRating(Number(e.target.value));
    };
    const handleImageCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
        setImageCaption(e.target.value);
    };

    // 파일 입력 필드 변경 핸들러
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setImagePreviewUrl(null);
        }
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

        // 클라이언트 측 유효성 검사 (필수 필드)
        if (!reviewTitle.trim() || !newReviewContent.trim()) { // 유효성 검사 필드 조정
            setModalMessage('제목과 리뷰 내용을 모두 입력해주세요.');
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

        // FormData 객체 생성: 텍스트 데이터와 파일 데이터를 함께 보낼 때 사용
        const formDataToSend = new FormData();
        // [백엔드 연동 필요] username은 실제 로그인된 사용자 ID를 사용해야 합니다.
        formDataToSend.append('username', 'currentLoggedInUser'); // 임시 사용자 이름
        formDataToSend.append('title', reviewTitle);
        formDataToSend.append('content', newReviewContent);
        formDataToSend.append('rating', newReviewRating.toString());
        if (selectedFile) {
            formDataToSend.append('image', selectedFile); // 'image'는 백엔드에서 파일을 받을 때 사용할 필드 이름
            if (imageCaption) {
                formDataToSend.append('caption', imageCaption); // 이미지 캡션
            }
        }

        try {
            // POST 요청으로 새로운 리뷰를 서버에 보냅니다.
            // [백엔드 연동 필요] 실제 API 엔드포인트와 파일 업로드 방식에 맞춰 수정해야 합니다.
            // axiosInstance가 'Content-Type': 'multipart/form-data' 헤더를 자동으로 처리해 줄 수 있습니다.
            const response = await apiClient.post<PostReviewResponse>('/reviews', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // 파일 업로드 시 필수 헤더
                },
            });

            const successMsg = response.data.message || '리뷰가 성공적으로 작성되었습니다!';
            setModalMessage(successMsg);
            setMessageType('success');
            setShowModal(true);

            // 폼 초기화
            setReviewTitle('');
            setNewReviewContent('');
            setNewReviewRating(5);
            setImageCaption('');
            setSelectedFile(null);
            setImagePreviewUrl(null);

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
                {/* 리뷰 제목 */}
                <div className={styles.formGroup}>
                    <label htmlFor="reviewTitle">리뷰 제목:</label>
                    <input
                        type="text"
                        id="reviewTitle"
                        value={reviewTitle}
                        onChange={handleTitleChange}
                        required
                        className={styles.inputField}
                        placeholder="리뷰 제목을 입력해주세요."
                    />
                </div>

                {/* 행사 ID 제거 */}
                {/* 행사 제목 제거 */}

                {/* 리뷰 내용 */}
                <div className={styles.formGroup}>
                    <label htmlFor="reviewContent">리뷰 내용:</label>
                    <textarea
                        id="reviewContent"
                        value={newReviewContent}
                        onChange={handleContentChange}
                        required
                        rows={6}
                        className={styles.textareaField}
                        placeholder="솔직한 리뷰를 남겨주세요."
                    ></textarea>
                </div>

                {/* 별점 */}
                <div className={styles.formGroup}>
                    <label htmlFor="reviewRating">별점:</label>
                    <select
                        id="reviewRating"
                        value={newReviewRating}
                        onChange={handleRatingChange}
                        required
                        className={styles.selectField}
                    >
                        {/* 별 아이콘과 숫자 동시 표시, value는 숫자로 유지 */}
                        {[5, 4, 3, 2, 1].map(ratingValue => (
                            <option key={ratingValue} value={ratingValue}>
                                {'⭐'.repeat(ratingValue)} {ratingValue}점
                            </option>
                        ))}
                    </select>
                </div>

                {/* 이미지 첨부 필드 */}
                <div className={styles.formGroup}>
                    <label htmlFor="reviewImage">이미지 첨부 (선택 사항):</label>
                    <input
                        type="file"
                        id="reviewImage"
                        name="reviewImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                    />
                    {imagePreviewUrl && (
                        <div className={styles.imagePreviewContainer}>
                            <img src={imagePreviewUrl} alt="이미지 미리보기" className={styles.imagePreview} />
                            {/* 이미지 캡션 입력 필드 */}
                            <input
                                type="text"
                                value={imageCaption}
                                onChange={handleImageCaptionChange}
                                className={styles.inputField}
                                placeholder="사진 설명 (선택 사항)"
                            />
                            <button type="button" onClick={() => { setSelectedFile(null); setImagePreviewUrl(null); setImageCaption(''); }} className={styles.removeImageButton}>
                                이미지 제거
                            </button>
                        </div>
                    )}
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
                        onClick={() => navigate('/review')}
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
