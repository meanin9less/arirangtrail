import React from 'react';

// ✅ 1. Props 인터페이스 수정
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string; // CommunityPage에서 title을 사용하므로 추가합니다.
    children: React.ReactNode; // ✅ `children`을 받을 수 있도록 명시적으로 추가합니다.
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    // isOpen이 false이면 아무것도 렌더링하지 않습니다.
    if (!isOpen) return null;

    // 모달 오버레이 클릭 시 닫히도록 하는 함수
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={handleOverlayClick}>
            <div style={modalStyles.modal}>
                {/* 헤더 부분 */}
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>{title}</h2>
                    <button onClick={onClose} style={modalStyles.closeButton}>×</button>
                </div>
                {/* ✅ 2. 본문(children) 렌더링 */}
                <div style={modalStyles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const modalStyles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '8px',
        width: 'auto',
        minWidth: '400px', // 최소 너비 지정
        maxWidth: '90%',   // 최대 너비 지정
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden', // 내부 콘텐츠가 넘치지 않도록
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
    },
    title: {
        margin: 0,
        fontSize: '1.2rem',
        color: '#333',
        fontWeight: '600',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#888',
        padding: '0 5px'
    },
    content: {
        padding: '20px', // 모달 내부 콘텐츠에 패딩을 줍니다.
    }
};

export default Modal;