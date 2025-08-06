import React, {useEffect, useState} from 'react';
import styles from './Footer.module.css';
import apiClient from "../api/axiosInstance"; // 푸터 스타일 임포트



const Footer: React.FC = () => {
    const [visitorCount, setVisitorCount] = useState(0);

    useEffect(() => {
        const trackAndFetchCount = async () => {
            try {
                const response = await apiClient.get('visitors/track-and-get-count');
                setVisitorCount(response.data.count);
            } catch (error) {
                console.error("방문자 수 기록/조회 실패:", error);
            }
        };
        trackAndFetchCount();
    }, []);
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <p className={styles.companyName}>아리랑 트레일 (Arirang Trail)</p>
                <div className={styles.allcontent}>
                    <p className={styles.address}>서울특별시 종로구 세종대로 123, 아리랑빌딩 7층</p>
                    <p className={styles.contact}>대표 전화: 02-1234-5678 | 이메일: info@arirangtrail.com</p>
                    <p className={styles.contact2}>출처: 한국관광공사</p>
                </div>
                {visitorCount !== 0 && (
                    <p className={styles.contact2}>
                        금일 홈페이지 방문자수 : {visitorCount}
                    </p>
                )}
                <p className={styles.copyright}>&copy; {new Date().getFullYear()} Arirang Trail. All rights
                    reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
