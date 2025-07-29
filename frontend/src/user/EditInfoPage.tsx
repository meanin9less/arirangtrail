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
    birthdate: string; // YYYY-MM-DD 형식으로 가정 (백엔드 LocalDate와 매핑)
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
    const [submitting, setSubmitting] = useState<boolean>(false); // 제출 중 로딩 상태 (이전 'boolean' 타입 오타 수정)
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
                // 이미지 URL 설정: 백엔드에서 받은 URL이 있으면 사용, 없으면 null
                setCurrentImageUrl(profileData.imageUrl || null);
                setSelectedFile(null); // 새 정보 로드 시 파일 선택 초기화
                setImagePreviewUrl(null); // 새 정보 로드 시 미리보기 초기화
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
            setLoading(false);
        }
    }, [isLoggedIn, navigate, jwtToken]); // jwtToken을 의존성 배열에 추가

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
            // 파일 선택 취소 시 기존 이미지 URL을 다시 표시 (originalProfile이 로드된 경우)
            setCurrentImageUrl(originalProfile?.imageUrl || null);
        }
    };

    // 파일 선택 취소 핸들러
    const handleClearFile = () => {
        setSelectedFile(null); // 선택된 파일 초기화
        setImagePreviewUrl(null); // 미리보기 URL 초기화

        // 기존 이미지 URL이 있으면 표시, 없으면 기본 이미지로 되돌림
        setCurrentImageUrl(originalProfile?.imageUrl || null);

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

        // originalProfile이 null일 경우를 대비한 방어 코드
        if (!originalProfile) {
            setModalMessage('사용자 정보를 찾을 수 없어 업데이트를 진행할 수 없습니다.');
            setModalMessageType('error');
            setShowModal(true);
            setSubmitting(false);
            return;
        }

        try {
            // 1단계: 텍스트 정보만 업데이트 (application/json)
            // UserDTO에 맞게 username과 현재 imageurl을 포함하여 전송
            const textData = {
                username: originalProfile.username, // 필수: 백엔드 UserDTO에 username 필드가 있으므로 반드시 포함
                email: formData.email,
                firstname: formData.firstname,
                lastname: formData.lastname,
                birthdate: formData.birthdate, // YYYY-MM-DD 문자열로 전송
                nickname: formData.nickname,
                // imageurl은 selectedFile이 없으면 currentImageUrl을 사용, 있으면 null (새 이미지 업로드 시 백엔드에서 처리)
                // 백엔드에서 imageurl이 null 허용이므로, 여기서는 보내지 않아도 됩니다.
                // 단, 사용자가 "기본 프로필" 버튼을 눌러 이미지를 제거했다면, imageurl을 null로 명시적으로 보내야 합니다.
                imageurl: selectedFile ? null : (currentImageUrl || null) // 선택된 파일이 있으면 null, 없으면 현재 이미지 URL 유지 (또는 null)
            };

            // 만약 '기본 프로필' 버튼을 눌러 이미지를 제거하는 경우, imageurl을 명시적으로 null로 보내야 합니다.
            // 이 로직은 selectedFile이 없고, originalProfile.imageUrl이 있었는데 currentImageUrl이 null이 된 경우에 해당합니다.
            if (!selectedFile && originalProfile.imageUrl && currentImageUrl === null) {
                textData.imageurl = null;
            }

            // ✨ 디버깅을 위해 전송할 데이터 로깅
            console.log('Sending textData to /update-inform:', textData);


            const response1 = await apiClient.put<ApiResponse>(
                '/update-inform',
                textData,
                {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`, // Authorization 헤더 추가
                        'Content-Type': 'application/json', // 명시적 Content-Type
                    },
                }
            );

            // 2단계: 이미지 변경이 있다면 업로드 (multipart/form-data)
            if (selectedFile) {
                // selectedFile이 null이 아닌지 다시 확인
                if (!selectedFile) {
                    console.error('이미지 파일이 선택되지 않았습니다.');
                    throw new Error('이미지 파일이 선택되지 않았습니다.');
                }

                const imageForm = new FormData();
                imageForm.append('image', selectedFile);
                imageForm.append('username', originalProfile.username); // 백엔드에서 누군지 알아야 저장 가능

                // ✨ apiClient 사용 권장: axios 대신 apiClient를 사용하여 기본 설정(baseURL, withCredentials 등)을 활용합니다.
                const imageRes = await apiClient.post<ApiResponse>(
                    '/upload-profile-image', // baseURL이 이미 설정되어 있으므로 상대 경로 사용
                    imageForm,
                    {
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
            }

            // 성공 알림
            setModalMessage('정보가 성공적으로 수정되었습니다.');
            setModalMessageType('success');
            setShowModal(true);

        } catch (err: any) {
            console.error('정보 수정 오류:', err);
            let errorMessage = '정보 수정에 실패했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                // 백엔드에서 보낸 에러 메시지가 있다면 사용
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
