
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ReviewWrite.module.css';
import {useSelector} from "react-redux";
import {RootState} from "../store";

interface Location {
    contentid: string;
    title: string;
}

interface ReviewData {
    username: string;
    contentid: string;
    contenttitle: string;
    title: string;
    content: string;
    rating: number;
    visitdate: string;
    photos: {
        s3Url: string;
    }[];
}

function ReviewUpdatePage() {
    const { reviewId } = useParams<{ reviewId: string }>();
    const navigate = useNavigate();
    const username = useSelector((state: RootState) => state.token.userProfile?.username);
    if(!username){
        navigate(-1);
    }
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [rating, setRating] = useState<number>(5);
    const [visitDate, setVisitDate] = useState<string>('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<{ s3Url: string }[]>([]);

    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');

    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                const response = await apiClient.get(`/reviews/${reviewId}`);
                const review: ReviewData = response.data;
                setTitle(review.title);
                setContent(review.content);
                setRating(review.rating);
                setVisitDate(review.visitdate);
                setSelectedLocation(review.contentid);
                setExistingPhotos(review.photos);
                setImagePreviews(review.photos.map(p => p.s3Url));
            } catch (error) {
                console.error('리뷰 정보 조회 오류:', error);
                setModalMessage('리뷰 정보를 불러오는 데 실패했습니다.');
                setMessageType('error');
                setShowModal(true);
            }
        };
        fetchReviewData();
    }, [reviewId]);


    useEffect(() => {
        if (visitDate) {
            const fetchLocations = async () => {
                setLoading(true);
                try {
                    const formattedDate = visitDate.replace(/-/g, '');
                    const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
                    const API_URL =
                        `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
                    const response = await axios.get(API_URL, {
                        params: {
                            numOfRows: 150,
                            pageNo: 1,
                            arrange: "B",
                            eventStartDate: formattedDate,
                            eventEndDate: formattedDate
                        },
                    });
                    const items = response.data.response.body.items.item;
                    if (items) {
                        const extractedLocations = items.map((item: any) => ({
                            contentid: item.contentid,
                            title: item.title,
                        }));
                        setLocations(extractedLocations);
                    } else {
                        setLocations([]);
                    }
                    setLoading(false);
                } catch (error) {
                    console.error('여행지 정보 조회 오류:', error);
                    setModalMessage('해당 날짜의 여행지 정보를 불러오는 데 실패했습니다.');
                    setMessageType('error');
                    setShowModal(true);
                    setLocations([]);
                    setLoading(false);
                }
            };

            fetchLocations();
        }
    }, [visitDate]);

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
            navigate(`/review/${reviewId}`);
        }
    };

    const handleSubmitReview = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setModalMessage('');
        setMessageType(null);

        const selectedLocationInfo = locations.find(loc => loc.contentid === selectedLocation);

        if (!title.trim() || !content.trim() || !visitDate || !selectedLocation) {
            setModalMessage('모든 필드를 입력해주세요.');
            setMessageType('error');
            setShowModal(true);
            setLoading(false);
            return;
        }

        const formData = new FormData();
        const updateRequest = {
            reviewId,
            username: username,
            contentid: selectedLocationInfo?.contentid,
            contenttitle: selectedLocationInfo?.title,
            title,
            content,
            rating,
            visitdate: visitDate,
        };

        formData.append('updateRequest', new Blob([JSON.stringify(updateRequest)], { type: "application/json" }));

        photos.forEach(photo => {
            formData.append('photos', photo);
        });

        try {
            const response = await apiClient.put(`/reviews`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const successMsg = response.data.message || '리뷰가 성공적으로 수정되었습니다!';
            setModalMessage(successMsg);
            setMessageType('success');
            setShowModal(true);

        } catch (error: any) {
            console.error('리뷰 수정 오류:', error);
            let errorMessage = '리뷰 수정에 실패했습니다: 네트워크 오류 또는 알 수 없는 오류';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.message || '리뷰 수정 실패: 서버 오류';
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
            <h2>리뷰 수정</h2>

            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
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
                    <label htmlFor="locationSelect">여행지 선택:</label>
                    <select
                        id="locationSelect"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        required
                        className={styles.selectField}
                        disabled={!visitDate || locations.length === 0}
                    >
                        <option value="">{visitDate ? '여행지를 선택하세요' : '방문 날짜를 먼저 선택하세요'}</option>
                        {locations.map(location => (
                            <option key={location.contentid} value={location.contentid}>
                                {location.title}
                            </option>
                        ))}
                    </select>
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
                    <label htmlFor="reviewImage">이미지 첨부 (선택 사항):</label>
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
                        {loading ? '수정 중...' : '리뷰 수정'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/review/${reviewId}`)}
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

export default ReviewUpdatePage;
