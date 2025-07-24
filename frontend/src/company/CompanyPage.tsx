import React, { useState, useEffect } from 'react';
import styles from './CompanyPage.module.css'; // 회사소개 페이지 스타일 임포트

import logo from '../images/arirang1.png';
import img1a from '../images/korea1.jpg';
import img1b from '../images/korea2.jpg';
import img1c from '../images/korea3.jpg';
import img1d from '../images/korea4.jpg';

import img2a from '../images/korea3.jpg';
import img2b from '../images/korea4.jpg';
import img2c from '../images/korea1.jpg';
import img2d from '../images/korea2.jpg';

import img3a from '../images/korea1.jpg';
import img3b from '../images/korea2.jpg';
import img3c from '../images/korea3.jpg';
import img3d from '../images/korea4.jpg';

import img4a from '../images/korea3.jpg';
import img4b from '../images/korea4.jpg';
import img4c from '../images/korea1.jpg';
import img4d from '../images/korea2.jpg';

const sections = [
    { images: [img1a, img1b,img1c,img1d], title: '아리랑 트레일', text: '한국의 축제와 문화를 경험하세요.' },
    { images: [img2a, img2b,img2c,img2d], title: '여행자 커뮤니티', text: '같은 관심사, 같은 여정의 친구 찾기' },
    { images: [img3a, img3b,img3c,img3d], title: '로컬 체험', text: '지역 주민과 함께하는 진짜 한국 여행' },
    { images: [img4a, img4b,img4c,img4d], title: '지속 가능한 여행', text: '환경을 생각하는 의미 있는 여정' },
];

const CompanyPage: React.FC = () => {
    const [imageIndexes, setImageIndexes] = useState([0, 0, 0, 0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setImageIndexes((prev) =>
                prev.map((i, sectionIdx) => (i + 1) % sections[sectionIdx].images.length)
            );
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.pageWrapper}>
            {sections.map((section, idx) => (
                <div
                    key={idx}
                    className={styles.section}
                    style={{ backgroundImage: `url(${section.images[imageIndexes[idx]]})` }}
                >
                    <div className={styles.overlay}>
                        {idx === 0 && <img src={logo} alt="아리랑 트레일 로고" className={styles.logo} />}
                        <h1 className={styles.title}>{section.title}</h1>
                        <p className={styles.text}>{section.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CompanyPage;
