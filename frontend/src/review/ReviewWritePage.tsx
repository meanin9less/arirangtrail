import React, { useState, ChangeEvent, FormEvent } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ReviewWrite.module.css';
import {useSelector} from "react-redux";
import {RootState} from "../store";

function ReviewWritePage() {
    const navigate = useNavigate();
    const username = useSelector((state : RootState) => state.token.userProfile.username);
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [rating, setRating] = useState<number>(5);
    const [visitDate, setVisitDate] = useState<string>('');
    const [contentId, setContentId] = useState<string>('');
    const [contentTitle, setContentTitle] = useState<string>('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setPhotos(files);

            const previewUrls = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previewUrls);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        if (messageType === 'success') {
            navigate('/review');
        }
    };

    const handleSubmitReview = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setModalMessage('');
        setMessageType(null);

        if (!title.trim() || !content.trim() || !visitDate || !contentId.trim() || !contentTitle.trim()) {
            setModalMessage('모든 필드를 입력해주세요.');
            setMessageType('error');
            setShowModal(true);
            setLoading(false);
            return;
        }

        const formData = new FormData();
        const createRequest = {
            username, // 실제 사용자 이름으로 교체 필요
            contentid: Number(contentId),
            contenttitle: contentTitle,
            title,
            content,
            rating,
            visitdate: visitDate,
        };

        formData.append('createRequest', new Blob([JSON.stringify(createRequest)], { type: "application/json" }));

        photos.forEach(photo => {
            formData.append('photos', photo);
        });

        try {
            const response = await apiClient.post('/api/reviews', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const successMsg = response.data.message || '리뷰가 성공적으로 작성되었습니다!';
            setModalMessage(successMsg);
            setMessageType('success');
            setShowModal(true);

            setTitle('');
            setContent('');
            setRating(5);
            setVisitDate('');
            setContentId('');
            setContentTitle('');
            setPhotos([]);
            setImagePreviews([]);

            navigate("/review");

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
                    <label htmlFor="contentId">여행지 ID:</label>
                    <input
                        type="text"
                        id="contentId"
                        value={contentId}
                        onChange={(e) => setContentId(e.target.value)}
                        required
                        className={styles.inputField}
                        placeholder="여행지 ID를 입력해주세요."
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="contentTitle">여행지 제목:</label>
                    <input
                        type="text"
                        id="contentTitle"
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                        required
                        className={styles.inputField}
                        placeholder="여행지 제목을 입력해주세요."
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="reviewTitle">리뷰 제목:</label>
                    <input
                        type="text"
                        id="reviewTitle"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className={styles.inputField}
                        placeholder="리뷰 제목을 입력해주세요."
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="reviewContent">리뷰 내용:</label>
                    <textarea
                        id="reviewContent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={6}
                        className={styles.textareaField}
                        placeholder="솔직한 리뷰를 남겨주세요."
                    ></textarea>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="reviewRating">별점:</label>
                    <select
                        id="reviewRating"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        required
                        className={styles.selectField}
                    >
                        {[5, 4, 3, 2, 1].map(ratingValue => (
                            <option key={ratingValue} value={ratingValue}>
                                {'⭐'.repeat(ratingValue)} {ratingValue}점
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="visitDate">방문 날짜:</label>
                    <input
                        type="date"
                        id="visitDate"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        required
                        className={styles.inputField}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="reviewImage">이미지 첨부</label>
                    <input
                        type="file"
                        id="reviewImage"
                        name="reviewImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        multiple
                    />
                    <div className={styles.imagePreviewContainer}>
                        {imagePreviews.map((preview, index) => (
                            <img key={index} src={preview} alt={`이미지 미리보기 ${index + 1}`} className={styles.imagePreview} />
                        ))}
                    </div>
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