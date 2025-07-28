import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './EditInfoPage.module.css'; // EditInfoPage 전용 스타일 임포트

// 사용자 프로필 정보 인터페이스 (백엔드 응답에 맞춰 정의)
interface UserProfile {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    birthdate: string; // YYYY-MM-DD 형식으로 가정
    nickname: string;
    imageUrl?: string; // 프로필 사진 URL
}

// 수정 가능한 필드들을 위한 폼 데이터 인터페이스 (imageUrl은 파일로 처리되므로 여기서 제거)
interface EditFormData {
    email: string;
    firstname: string;
    lastname: string;
    birthdate: string;
    nickname: string;
}

// 응답 메시지 인터페이스
interface ApiResponse {
    message: string;
}

// ✨ 추가: EditInfoPage에서 사용할 기본 프로필 이미지 URL
const defaultEditPageProfileIcon = 'https://placehold.co/150x150/cccccc/ffffff?text=No+Image';

const EditInfoPage: React.FC = () => {
    const navigate = useNavigate();
    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;

    // 현재 사용자 정보를 저장할 상태
    const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
    // 폼 입력 값을 저장할 상태 (수정 가능한 필드)
    const [formData, setFormData] = useState<EditFormData>({
        email: '',
        firstname: '',
        lastname: '',
        birthdate: '',
        nickname: '',
    });

    // 이미지 파일 관련 상태
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // 사용자가 선택한 파일 객체
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // 선택된 파일의 미리보기 URL
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // 백엔드에서 받아온 기존 이미지 URL

    const [loading, setLoading] = useState<boolean>(true); // 초기 로딩 상태
    const [submitting, setSubmitting] = useState<boolean>(false); // 제출 중 로딩 상태
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [modalMessageType, setModalMessageType] = useState<'success' | 'error' | null>(null);

    // 컴포넌트 마운트 시 사용자 정보 불러오기
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login'); // 로그인하지 않았다면 로그인 페이지로 리디렉션
            return;
        }

        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get<UserProfile>('/userinfo', {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                });
                const profileData = response.data;

                setOriginalProfile(profileData);
                setFormData({
                    email: profileData.email,
                    firstname: profileData.firstname,
                    lastname: profileData.lastname,
                    birthdate: profileData.birthdate,
                    nickname: profileData.nickname,
                });
                setCurrentImageUrl(profileData.imageUrl || null);
                setSelectedFile(null);
                setImagePreviewUrl(null);
            } catch (err: any) {
                console.error('사용자 정보 불러오기 오류:', err);
                let errorMessage = '사용자 정보를 불러오는 데 실패했습니다.';
                if (axios.isAxiosError(err) && err.response) {
                    errorMessage = err.response.data?.message || errorMessage;
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (isLoggedIn) {
        fetchUserProfile();
        } else {
            setLoading(false); // 로그인 안 된 상태면 로딩 종료 (위에 navigate 로직이 활성화되면 필요 없음)
        }
    }, [isLoggedIn, navigate]); // isLoggedIn 또는 navigate 변경 시 다시 실행

    // 폼 입력 필드 변경 핸들러 (텍스트 필드)
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // 파일 입력 필드 변경 핸들러
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file); // 선택된 파일 객체 저장
            setImagePreviewUrl(URL.createObjectURL(file)); // 새 파일의 미리보기 URL 생성
            setCurrentImageUrl(null); // 새 파일 선택 시 기존 이미지 URL은 숨김
        } else {
            setSelectedFile(null);
            setImagePreviewUrl(null);
            // 파일 선택 취소 시 기존 이미지 URL을 다시 표시
            setCurrentImageUrl(originalProfile?.imageUrl || null);
        }
    };

    // ✨ 추가: 파일 선택 취소 핸들러
    const handleClearFile = () => {
        setSelectedFile(null); // 선택된 파일 초기화
        setImagePreviewUrl(null); // 미리보기 URL 초기화
        setCurrentImageUrl(originalProfile?.imageUrl || null); // 기존 이미지 또는 기본 이미지로 되돌림

        // 파일 input 요소의 값을 초기화하여, 동일 파일 재선택 시 change 이벤트가 발생하도록 함
        const fileInput = document.getElementById('profileImage') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // 폼 제출 핸들러 (정보 업데이트)
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setModalMessageType(null);

        // FormData 객체를 사용하여 텍스트 데이터와 파일을 함께 전송
        const formDataToSend = new FormData();
        // 텍스트 필드 추가
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, (formData as any)[key]);
        });

        // 이미지 파일 추가: 'profileImage'는 백엔드에서 파일을 받을 때 사용할 필드 이름
        if (selectedFile) {
            formDataToSend.append('profileImage', selectedFile);
        }
        // ✨ 이미지 제거 로직: selectedFile이 null이고, 원래 이미지가 있었는데 현재 이미지가 null이면 이미지 제거 요청
        else if (currentImageUrl === null && originalProfile?.imageUrl) {
            formDataToSend.append('removeImage', 'true');
        }

        try {
            // [백엔드 연동 필요] PUT 요청으로 사용자 정보 업데이트
            // FormData 사용 시 axios가 'Content-Type': 'multipart/form-data' 헤더를 자동으로 설정합니다.
                const response = await apiClient.put<ApiResponse>('/update-inform', formDataToSend);

            setModalMessage(response.data.message || '정보가 성공적으로 수정되었습니다.');
            setModalMessageType('success');
            setShowModal(true);

            // 성공적으로 업데이트되면 원본 프로필도 업데이트 (선택 사항)
            // 실제로는 백엔드에서 업데이트된 프로필 정보를 다시 받아와서 originalProfile을 갱신하는 것이 좋습니다.
            // 여기서는 임시로 formData와 업데이트된 이미지 URL로 originalProfile을 갱신합니다.
            setOriginalProfile(prev => prev ? { ...prev, ...formData, imageUrl: imagePreviewUrl || currentImageUrl || undefined } : null);
            setCurrentImageUrl(imagePreviewUrl || currentImageUrl); // 현재 이미지 URL 업데이트

        } catch (err: any) {
            console.error('정보 수정 오류:', err);
            let errorMessage = '정보 수정에 실패했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setModalMessage(errorMessage);
            setModalMessageType('error');
            setShowModal(true);
        } finally {
            setSubmitting(false);
        }
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        setModalMessageType(null);
        if (modalMessageType === 'success') {
            navigate('/mypage'); // 성공 시 마이페이지로 돌아가기
        }
    };

    if (!isLoggedIn) {
        return (
            <div className={styles.editInfoContainer}>
                <p className={styles.message}>로그인이 필요합니다.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.editInfoContainer}>
                <p className={styles.message}>사용자 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.editInfoContainer}>
                <p className={`${styles.message} ${styles.errorMessage}`}>{error}</p>
            </div>
        );
    }

    if (!originalProfile) {
        return (
            <div className={styles.editInfoContainer}>
                <p className={`${styles.message} ${styles.errorMessage}`}>사용자 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className={styles.editInfoContainer}>
            <h2 className={styles.pageTitle}>회원 정보 수정</h2>
            <form onSubmit={handleSubmit} className={styles.editForm}>
                {/* 프로필 이미지 미리보기 */}
                <div className={styles.formGroup}>
                    <div className={styles.imagePreviewContainer}>
                        <img
                            src={imagePreviewUrl || currentImageUrl || defaultEditPageProfileIcon} // ✨ 기본 이미지 적용
                            alt="프로필 미리보기"
                            className={styles.profileImagePreview}
                            onError={(e) => { // 이미지 로드 실패 시 기본 이미지로 대체
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // 무한 루프 방지
                                target.src = defaultEditPageProfileIcon;
                            }}
                        />
                    </div>
                </div>

                {/* 이미지 첨부 필드 및 파일 선택 취소 버튼 */}
                {/* ✨ 새로운 클래스 fileUploadGroup 추가 */}
                <div className={`${styles.formGroup} ${styles.fileUploadGroup}`}>
                    <div>
                        <label htmlFor="profileImage">프로필 이미지 업데이트</label>
                        <input
                            type="file"
                            id="profileImage"
                            name="profileImage"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                        />
                    </div>
                    {/* ✨ 파일 선택 취소 버튼을 항상 표시 */}
                    <div style={{marginTop: '10px'}}>
                        <button
                            type="button"
                            onClick={handleClearFile}
                            className={styles.clearFileButton}
                        >
                            기본 프로필
                        </button>
                    </div>
                </div>

                {/* 사용자명 (읽기 전용) */}
                <div className={styles.formGroup}>
                    <label>아이디:</label>
                    <input
                        type="text"
                        value={originalProfile.username}
                        className={styles.inputField}
                        disabled // 읽기 전용
                    />
                    <p className={styles.helpText}>아이디는 변경할 수 없습니다.</p>
                </div>

                {/* 이메일 (수정 가능) */}
                <div className={styles.formGroup}>
                    <label htmlFor="email">이메일:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                {/* 닉네임 (수정 가능) */}
                <div className={styles.formGroup}>
                    <label htmlFor="nickname">닉네임:</label>
                    <input
                        type="text"
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                {/* 성 (수정 가능) */}
                <div className={styles.formGroup}>
                    <label htmlFor="firstname">성:</label>
                    <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                {/* 이름 (수정 가능) */}
                <div className={styles.formGroup}>
                    <label htmlFor="lastname">이름:</label>
                    <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                {/* 생년월일 (수정 가능) */}
                <div className={styles.formGroup}>
                    <label htmlFor="birthdate">생년월일:</label>
                    <input
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        required
                        className={styles.inputField}
                    />
                </div>

                <div className={styles.buttonContainer}>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={styles.submitButton}
                    >
                        {submitting ? '저장 중...' : '정보 저장'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/mypage')}
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
};

export default EditInfoPage;
