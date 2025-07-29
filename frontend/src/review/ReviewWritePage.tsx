import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react'; // <<< 추가된 부분: useEffect
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ReviewWrite.module.css';

// <<< 추가된 부분: API 응답으로 받을 여행지 데이터 타입 정의 (필요시 수정하세요)
interface Location {
    contentid: string;
    title: string;
}

function ReviewWritePage() {
    const navigate = useNavigate();

    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [rating, setRating] = useState<number>(5);
    const [visitDate, setVisitDate] = useState<string>('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // <<< 추가된 부분: API로부터 받은 여행지 목록과 선택된 여행지 정보를 위한 상태
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>(''); // contentid를 저장

    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    // <<< 추가된 부분: 방문 날짜가 변경될 때 API를 호출하는 함수
    useEffect(() => {
        if (visitDate) {
            const fetchLocations = async () => {
                setLoading(true);
                try {
                    const SERVICE_KEY = "WCIc8hzzBS3Jdod%2BVa357JmB%2FOS0n4D2qPHaP9PkN4bXIfcryZyg4iaZeTj1fEYJ%2B8q2Ol8FIGe3RkW3d72FHA%3D%3D";
                    const API_URL =
                        `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&MobileApp=AppTest&MobileOS=ETC&_type=json`;
                    const today = new Date();
                    const date = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                    const response = await apiClient.get(API_URL, {
                        params: { // 요청 파라미터
                            numOfRows: 150,
                            pageNo: 1,
                            arrange: "B", // 조회순
                            eventStartDate: date, // 오늘부터 시작하는 행사만 요청
                            eventEndDate: date
                        },
                    });
                    console.log(response.data);
                    // setLocations(response.data);
                    setLoading(false);
                } catch (error) {
                    console.error('여행지 정보 조회 오류:', error);
                    setModalMessage('해당 날짜의 여행지 정보를 불러오는 데 실패했습니다.');
                    setMessageType('error');
                    setShowModal(true);
                    setLocations([]); // 오류 발생 시 목록 초기화
                    setLoading(false);
                }
            };
            fetchLocations();
        }
    }, [visitDate]); // visitDate가 변경될 때마다 이 useEffect가 실행됩니다.

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

        if (!title.trim() || !content.trim() || !visitDate || !selectedLocation) {
            setModalMessage('모든 필드를 입력해주세요.');
            setMessageType('error');
            setShowModal(true);
            setLoading(false);
            return;
        }

        const formData = new FormData();
        const createRequest = {
            username: 'currentLoggedInUser', // 실제 사용자 이름으로 교체 필요
            contentid: "",
            contenttitle: "",
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

            // 폼 초기화
            setTitle('');
            setContent('');
            setRating(5);
            setVisitDate('');
            setSelectedLocation('');
            // setLocations([]);
            setPhotos([]);
            setImagePreviews([]);

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

                {<select>
                </select>}
                <div className={styles.formGroup}>
                    <label htmlFor="locationSelect">여행지 선택:</label>
                    <select
                        id="locationSelect"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        required
                        className={styles.selectField}
                        disabled={!visitDate || locations.length === 0} // 날짜가 선택되고 여행지 목록이 있을 때만 활성화
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
