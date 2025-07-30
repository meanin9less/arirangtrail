import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // useDispatch 추가
import { RootState, setUserProfile } from '../store'; // setUserProfile 액션 임포트
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
    const dispatch = useDispatch(); // useDispatch 훅 사용

    const jwtToken = useSelector((state: RootState) => state.token.token);
    const isLoggedIn = !!jwtToken;
    const storedUserProfile = useSelector((state: RootState) => state.token.userProfile); // Redux Store에서 가져옴

    const fileInputRef = useRef<HTMLInputElement>(null); // 파일 입력 필드 참조

    // 사용자 정보 상태 (초기값은 Redux Store 또는 null)
    const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null); // 초기 프로필 정보 저장용
    const [username, setUsername] = useState<string>(storedUserProfile?.username || '');
    const [email, setEmail] = useState<string>(storedUserProfile?.email || '');
    const [firstname, setFirstname] = useState<string>(storedUserProfile?.firstname || '');
    const [lastname, setLastname] = useState<string>(storedUserProfile?.lastname || '');
    const [nickname, setNickname] = useState<string>(storedUserProfile?.nickname || '');
    const [birthdate, setBirthdate] = useState<string>(storedUserProfile?.birthdate || '');
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(storedUserProfile?.imageUrl || null); // DB에 저장된 현재 이미지 URL
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // 새로 선택한 이미지 미리보기 URL

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false); // 제출 중 상태
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // 새로 선택된 파일 객체

    // 모달 상태 관리
    const [modalMessageType, setModalMessageType] = useState<'success' | 'error'>('success');

    // 사용자 정보 불러오기
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login'); // 로그인하지 않았으면 로그인 페이지로 리다이렉트
            return;
        }

        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                // JWT 토큰을 사용하여 사용자 정보 요청
                const response = await apiClient.get<UserProfile>('/userinfo', {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                });
                const userData = response.data;
                setOriginalProfile(userData); // 원본 프로필 저장
                setUsername(userData.username);
                setEmail(userData.email);
                setFirstname(userData.firstname);
                setLastname(userData.lastname);
                setNickname(userData.nickname);
                setBirthdate(userData.birthdate);
                setCurrentImageUrl(userData.imageUrl || null); // 이미지 URL 설정

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

    // 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImagePreviewUrl(URL.createObjectURL(file)); // 미리보기 URL 생성
        }
    };

    // '사진 변경' 버튼 클릭 시 파일 입력 클릭
    const handleImageChangeClick = () => {
        fileInputRef.current?.click();
    };

    // '기본 프로필' 버튼 클릭 시
    const handleSetDefaultImage = () => {
        setSelectedFile(null); // 선택된 파일 제거
        setImagePreviewUrl(null); // 미리보기 제거
        setCurrentImageUrl(null); // 현재 이미지 URL도 null로 설정 (DB에 null로 저장될 예정)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // 파일 입력 필드 초기화
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        const textData = {
            username: username,
            email: email,
            firstname: firstname,
            lastname: lastname,
            nickname: nickname,
            birthdate: birthdate,
            imageUrl: selectedFile ? currentImageUrl : currentImageUrl, // 이미지를 변경하지 않으면 기존 URL 유지
                                                                        // selectedFile이 있으면 (업로드) 백엔드에서 이미지 URL을 업데이트할 것이므로 currentImageUrl 값은 중요하지 않음.
                                                                        // selectedFile이 없고 currentImageUrl이 null이면 (기본 프로필로 변경) 백엔드에서 null로 업데이트할 것임.
        };

        try {
            // 1. 텍스트 정보 업데이트
            await apiClient.put<ApiResponse>(
                '/update-inform',
                textData,
                {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // 2. 이미지 변경이 있다면 업로드 또는 제거
            if (selectedFile) {
                const imageForm = new FormData();
                imageForm.append('image', selectedFile);
                await apiClient.post<ApiResponse>(
                    '/upload-profile-image',
                    imageForm,
                    {
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
            } else if (!selectedFile && originalProfile?.imageUrl && currentImageUrl === null) {
                // 기존 이미지가 있었는데 '기본 프로필'로 변경한 경우
                await apiClient.delete<ApiResponse>(
                    '/remove-profile-image',
                    {
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                        },
                    }
                );
            }

            // ✨ 핵심 변경: 모든 업데이트가 성공적으로 완료된 후,
            //    서버로부터 최신 사용자 정보를 다시 불러와 Redux Store를 업데이트합니다.
            const updatedProfileResponse = await apiClient.get<UserProfile>('/userinfo', {
                headers: { Authorization: `Bearer ${jwtToken}` },
            });
            dispatch(setUserProfile(updatedProfileResponse.data)); // Redux Store 업데이트

            alert('정보가 성공적으로 수정되었습니다.');
            navigate('/mypage'); // alert 후 바로 마이페이지로 이동

        } catch (err: any) {
            console.error('정보 수정 오류:', err);
            let errorMessage = '정보 수정 중 오류가 발생했습니다.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data?.message || errorMessage;
                if (err.response.status === 409) {
                    errorMessage = "이미 사용 중인 닉네임 또는 이메일입니다.";
                }
            }
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return <div className={styles.loadingMessage}>사용자 정보를 불러오는 중입니다...</div>;
    }

    if (error) {
        return <div className={styles.errorMessage}>오류: {error}</div>;
    }

    return (
        <div className={styles.editInfoContainer}>
            <h2 className={styles.pageTitle}>내 정보 수정</h2>
            <form onSubmit={handleSubmit} className={styles.editForm}>
                {/* 프로필 이미지 섹션 */}
                <div className={styles.profileImageSection}>
                    <img
                        src={imagePreviewUrl || currentImageUrl || 'https://placehold.co/100x100/cccccc/ffffff?text=User'}
                        alt="프로필 미리보기"
                        className={styles.profileImage}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://placehold.co/100x100/cccccc/ffffff?text=User'; // 이미지 로드 실패 시 대체 URL
                        }}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        style={{ display: 'none' }} // 숨겨진 파일 입력
                    />
                    <div className={styles.imageButtons}>
                        <button type="button" onClick={handleImageChangeClick} className={styles.changeImageButton}>
                            사진 변경
                        </button>
                        <button type="button" onClick={handleSetDefaultImage} className={styles.defaultImageButton}>
                            기본 프로필
                        </button>
                    </div>
                </div>

                {/* 기타 정보 입력 필드 */}
                <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>아이디</label>
                    <input
                        type="text"
                        id="username"
                        className={styles.inputField}
                        value={username}
                        readOnly // 아이디는 수정 불가
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="nickname" className={styles.label}>닉네임</label>
                    <input
                        type="text"
                        id="nickname"
                        className={styles.inputField}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>이메일</label>
                    <input
                        type="email"
                        id="email"
                        className={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="firstname" className={styles.label}>이름</label>
                    <input
                        type="text"
                        id="firstname"
                        className={styles.inputField}
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="lastname" className={styles.label}>성</label>
                    <input
                        type="text"
                        id="lastname"
                        className={styles.inputField}
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="birthdate" className={styles.label}>생년월일</label>
                    <input
                        type="date"
                        id="birthdate"
                        className={styles.inputField}
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className={styles.submitButton} disabled={submitting}>
                    {submitting ? '저장 중...' : '정보 저장'}
                </button>
            </form>

        </div>
    );
};

export default EditInfoPage;