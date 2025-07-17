import React from 'react';
import styles from './Footer.module.css'; // 푸터 스타일 임포트

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <p className={styles.companyName}>아리랑 트레일 (Arirang Trail)</p>
                <p className={styles.address}>서울특별시 종로구 세종대로 123, 아리랑빌딩 7층</p>
                <p className={styles.contact}>대표 전화: 02-1234-5678 | 이메일: info@arirangtrail.com</p>
                <p className={styles.copyright}>&copy; {new Date().getFullYear()} Arirang Trail. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
