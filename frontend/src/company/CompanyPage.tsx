import React from 'react';
import styles from './CompanyPage.module.css'; // 회사소개 페이지 스타일 임포트

// 아리랑 트레일 로고 이미지 임포트 (경로 확인)
import arirangLogo from '../images/arirang1.png';

const CompanyPage: React.FC = () => {
    return (
        <div className={styles.companyContainer}>
            {/* 아리랑 트레일 로고 */}
            <img src={arirangLogo} alt="아리랑 트레일 로고" className={styles.companyLogo} />

            {/* 회사 소개 제목 */}
            <h2 className={styles.companyTitle}>아리랑 트레일 (Arirang Trail)</h2>

            {/* 회사 소개 내용 */}
            <p className={styles.companyDescription}>
                아리랑 트레일은 한국의 아름다운 자연과 풍부한 문화를 탐험할 수 있는 특별한 여행 경험을 제공합니다.
                숨겨진 명소와 전통적인 축제를 발견하며, 한국의 진정한 매력을 느껴보세요.
                저희는 모든 여행자가 잊지 못할 추억을 만들 수 있도록 최선을 다하고 있습니다.
            </p>
            <p className={styles.companyDescription}>
                역사적인 유적지부터 현대적인 도시의 활기까지, 아리랑 트레일은 다양한 테마의 여행 코스를 제안합니다.
                전문 가이드와 함께하는 투어, 지역 주민들과의 교류 프로그램, 그리고 K-POP, 한복 체험 등
                다채로운 액티비티를 통해 한국을 깊이 이해하고 사랑하게 될 것입니다.
            </p>
            <p className={styles.companyDescription}>
                저희는 지속 가능한 여행을 추구하며, 지역 사회에 긍정적인 영향을 미치기 위해 노력합니다.
                아리랑 트레일과 함께 한국의 아름다운 길을 걸으며, 새로운 발견과 감동을 경험하시길 바랍니다.
            </p>

            {/* 추가 정보 섹션 (선택 사항) */}
            <div className={styles.contactInfo}>
                <h3>문의하기</h3>
                <p>이메일: info@arirangtrail.com</p>
                <p>전화: 02-1234-5678</p>
                <p>주소: 서울특별시 종로구 세종대로 123, 아리랑빌딩 7층</p>
            </div>
        </div>
    );
};

export default CompanyPage;
