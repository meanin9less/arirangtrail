
import React from 'react';
import { EMOTICONS, Emoticon } from '../data/emoticons';

interface EmoticonPickerProps {
    onSelect: (emoticon: Emoticon) => void;
}

const EmoticonPicker: React.FC<EmoticonPickerProps> = ({ onSelect }) => {
    return (
        <div style={styles.pickerContainer}>
            {EMOTICONS.map((emoticon) => (
                <img
                    key={emoticon.id}
                    src={emoticon.localSrc} // UI에는 로컬 이미지를 보여줍니다.
                    alt={emoticon.name}
                    onClick={() => onSelect(emoticon)} // 클릭 시 emoticon 객체 전체를 콜백으로 전달합니다.
                    style={styles.emoticon}
                    title={emoticon.name}
                />
            ))}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    pickerContainer: {
        position: 'absolute',
        bottom: '110px', // '+' 버튼 메뉴 위에 위치
        left: '1px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        width: '220px',
    },
    emoticon: {
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
};

export default EmoticonPicker;