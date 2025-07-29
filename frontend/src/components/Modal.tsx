import React, { useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roomName: string) => void;
    successMessage?: string; // 성공 메시지를 위한 옵션적 prop
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onCreate, successMessage }) => {
    const [roomName, setRoomName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomName.trim()) {
            onCreate(roomName);
            setRoomName('');
        }
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                {successMessage ? (
                    <>
                        <h2 style={modalStyles.title}>알림</h2>
                        <p style={modalStyles.successMessage}>{successMessage}</p>
                        <div style={modalStyles.buttonContainer}>
                            <button onClick={onClose} style={modalStyles.confirmButton}>
                                확인
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={modalStyles.title}>새 채팅방 생성</h2>
                        <form onSubmit={handleSubmit} style={modalStyles.form}>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="채팅방 이름"
                                style={modalStyles.input}
                            />
                            <div style={modalStyles.buttonContainer}>
                                <button type="button" onClick={onClose} style={modalStyles.cancelButton}>
                                    취소
                                </button>
                                <button type="submit" style={modalStyles.createButton}>
                                    생성
                                </button>
                            </div>
                        </form>
                    </>
                )}
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
        padding: '20px',
        borderRadius: '8px',
        width: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    title: {
        margin: '0 0 15px 0',
        fontSize: '1.2rem',
        color: '#333',
    },
    successMessage: {
        fontSize: '16px',
        color: '#333',
        textAlign: 'center',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    input: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        width: '100%',
        maxWidth: '250px',
    },
    buttonContainer: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
    },
    cancelButton: {
        padding: '12px 20px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        color: '#333',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    createButton: {
        padding: '12px 20px',
        border: 'none',
        backgroundColor: '#2d3748',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    confirmButton: {
        padding: '12px 30px',
        border: 'none',
        backgroundColor: '#2d3748',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
};

export default Modal;