import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUserProfile } from '../store';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './EditInfoPage.module.css';

// API 응답 타입 정의 (백엔드와 일치하도록 확인)
interface ApiResponse {
    message: string;
    data?: any; // 필요에 따라 더 구체적인 타입으로 정의
}

// 사용자 프로필 DTO 인터페이스 (백엔드 /userinfo 응답과 일치)
interface UserProfile {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    nickname: string;
    birthdate: string; // YYYY-MM-DD 형식의 문자열
    imageUrl?: string; // 프로필 이미지 URL은 선택 사항
}

const EditInfoPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;
    const storedUserProfile = useSelector((state: RootState) => state.token.userProfile);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
    const [username, setUsername] = useState<string>(storedUserProfile?.username || '');
    const [email, setEmail] = useState<string>(storedUserProfile?.email || '');
    const [firstname, setFirstname] = useState<string>(storedUserProfile?.firstname || '');
    const [lastname, setLastname] = useState<string>(storedUserProfile?.lastname || '');
    const [nickname, setNickname] = useState<string>(storedUserProfile?.nickname || '');
    const [birthdate, setBirthdate] = useState<string>(storedUserProfile?.birthdate || '');
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(storedUserProfile?.imageurl || null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [modalMessageType, setModalMessageType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get<UserProfile>('/userinfo', {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                });
                const userData = response.data;
                setOriginalProfile(userData);
                setUsername(userData.username);
                setEmail(userData.email);
                setFirstname(userData.firstname);
                setLastname(userData.lastname);
                setNickname(userData.nickname);
                setBirthdate(userData.birthdate);
                setCurrentImageUrl(userData.imageUrl || null);
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

        fetchUserProfile();
    }, [isLoggedIn, jwtToken, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setImagePreviewUrl(null);
            // 파일 선택 취소 시 기존 이미지 URL로 돌아감
            setCurrentImageUrl(originalProfile?.imageUrl || null);
        }
    };

    const handleImageChangeClick = () => {
        fileInputRef.current?.click();
    };

    const handleSetDefaultImage = () => {
        setSelectedFile(null);
        setImagePreviewUrl(null);
        setCurrentImageUrl(null); // DB에 null로 저장되도록 명시적으로 설정
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        if (!originalProfile) {
            alert('사용자 정보를 찾을 수 없어 업데이트를 진행할 수 없습니다.');
            setSubmitting(false);
            return;
        }

        let finalImageUrl: string | null = currentImageUrl; // 기본적으로 현재 DB 이미지 URL 사용

        try {
            // 1. 새 파일이 선택되었다면, 이미지를 먼저 업로드하고 새 URL을 받습니다.
            if (selectedFile) {
                const imageForm = new FormData();
                imageForm.append('image', selectedFile); // 백엔드 @RequestParam("image")와 일치
                // username을 @AuthenticationPrincipal로 받으므로 FormData에 추가할 필요 없음

                const imageUploadResponse = await apiClient.post<string>( // 백엔드가 업로드된 URL을 문자열로 반환한다고 가정
                    '/upload-profile-image',
                    imageForm,
                    {
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                finalImageUrl = imageUploadResponse.data; // 업로드된 새 이미지 URL로 업데이트
            } else if (originalProfile.imageUrl && currentImageUrl === null) {
                // 2. '기본 프로필' 버튼을 눌러 기존 이미지를 명시적으로 제거한 경우
                //    이 경우 백엔드 /update-inform으로 imageurl: null을 보냅니다.
                finalImageUrl = null;
            }
            // 3. selectedFile이 없고 currentImageUrl도 변경되지 않은 경우 (텍스트만 수정)
            //    finalImageUrl은 currentImageUrl (기존 값)을 그대로 사용

            // 최종 사용자 정보 업데이트 요청 (텍스트 정보 + 최종 이미지 URL)
            const updatedUserData = {
                username: username,
                email: email,
                firstname: firstname,
                lastname: lastname,
                nickname: nickname,
                birthdate: birthdate, // YYYY-MM-DD 문자열
                imageurl: finalImageUrl // ✨ 최종 결정된 이미지 URL을 백엔드로 전송
            };

            const response = await apiClient.put<ApiResponse>(
                '/update-inform',
                updatedUserData,
                {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // 모든 업데이트가 성공적으로 완료된 후, 서버로부터 최신 사용자 정보를 다시 불러와 Redux Store를 업데이트합니다.
            const updatedProfileResponse = await apiClient.get<UserProfile>('/userinfo', {
                headers: { Authorization: `Bearer ${jwtToken}` },
            });
            dispatch(setUserProfile(updatedProfileResponse.data)); // Redux Store 업데이트

            alert('정보가 성공적으로 수정되었습니다.'); // alert 대신 커스텀 모달 사용 권장
            navigate('/mypage');

        } catch (err: any) {
            console.error('정보 수정 오류:', err);
            let errorMessage = '정보 수정 중 오류가 발생했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data?.message || errorMessage;
                if (err.response.status === 409) { // 충돌(Conflict) 에러 (예: 닉네임/이메일 중복)
                    errorMessage = "이미 사용 중인 닉네임 또는 이메일입니다.";
                }
            }
            alert(errorMessage); // alert 대신 커스텀 모달 사용 권장
        } finally {
            setSubmitting(false);
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
            <h2 className={styles.pageTitle}>내 정보 수정</h2>
            <form onSubmit={handleSubmit} className={styles.editForm}>
                {/* 프로필 이미지 미리보기 */}
                <div className={styles.formGroup}>
                    <div className={styles.imagePreviewContainer}>
                        <img
                            src={imagePreviewUrl || currentImageUrl || 'https://placehold.co/150x150/cccccc/ffffff?text=User'}
                            alt="프로필 미리보기"
                            className={styles.profileImagePreview}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/150x150/cccccc/ffffff?text=User';
                            }}
                        />
                    </div>
                </div>

                {/* 이미지 첨부 필드 및 파일 선택 취소 버튼 */}
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
                            ref={fileInputRef} // ref 연결
                        />
                    </div>
                    <div style={{marginTop: '10px'}}>
                        <button
                            type="button"
                            onClick={handleSetDefaultImage}
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
                        value={username}
                        className={styles.inputField}
                        disabled
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
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
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
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
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
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
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
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
        </div>
    );
};

export default EditInfoPage;
