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
                아리랑 트레일은 한국의 매력에 푹 빠지고 싶은 외국인 여행자들을 위한 특별한 플랫폼입니다.
                저희는 단순한 여행을 넘어, 한국의 다채로운 축제와 숨겨진 명소를 발견하고,
                새로운 친구들과 함께 잊지 못할 추억을 만들 수 있는 기회를 제공합니다.
            </p>
            <p  className={styles.companyDescription}>
                저희 웹사이트는 마치 디지털 게스트하우스와 같습니다.
                전 세계에서 온 여행자들이 커뮤니티 채팅을 통해 서로 교류하고,
                관심 있는 축제나 목적지를 함께 탐험할 동반자를 찾을 수 있습니다.
                혼자 여행하는 분들도, 그룹 여행을 선호하는 분들도 아리랑 트레일 커뮤니티 안에서 쉽게 어울리고 함께 길을 떠날 수 있도록 돕습니다.
            </p>
            <p className={styles.companyDescription}>
                역사적인 유적지부터 현대적인 도시의 활기, 그리고 K-POP, 한복 체험 등 다채로운 문화 액티비티까지,
                아리랑 트레일은 외국인 여행자의 눈높이에 맞춘 다양한 테마의 여행 코스를 제안합니다.
                전문 가이드와 함께하는 투어는 물론, 커뮤니티를 통해 자율적으로 형성되는 소그룹 여행을 통해 한국을 더욱 깊이 이해하고 사랑하게 될 것입니다.
            </p>
            <p className={styles.companyDescription}>
                저희는 지속 가능한 여행을 추구하며, 지역 사회에 긍정적인 영향을 미치기 위해 노력합니다.
                아리랑 트레일과 함께 한국의 아름다운 길을 걸으며, 새로운 발견과 감동, 그리고 소중한 인연을 경험하시길 바랍니다.
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
