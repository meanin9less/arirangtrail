import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearAuth, AppDispatch } from '../store'; // ✨ clearAuth 임포트
import styles from './User.module.css'; // User.module.css 임포트 (모달 스타일 재사용)

const LogoutPage = () => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage('');
        navigate('/login'); // 모달 닫기 후 로그인 페이지로 이동
    };

    useEffect(() => {
        // ✨ clearAuth 액션을 디스패치하여 토큰과 프로필 정보를 모두 초기화
        dispatch(clearAuth());
        localStorage.removeItem('jwtToken'); // 로컬 스토리지에서도 제거
        console.log('로컬 스토리지에서 JWT 토큰 제거됨.');
        console.log('Redux Store에서 토큰 및 프로필 상태 초기화됨.');

        setModalMessage('로그아웃 되었습니다.');
        setShowModal(true);

    }, [dispatch]);

    return (
        <div className={styles.authContainer}>
            <p className={styles.message}>로그아웃 처리 중...</p>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>알림</h3>
                        <p>
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

export default LogoutPage;
