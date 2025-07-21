import React, {useEffect} from 'react';

const TranslateWidget = () => {
    useEffect(() => {
        // 1. gtranslateSettings 객체를 window에 미리 설정합니다.
        // 이것이 스크립트가 로드되기 전에 먼저 실행되어야 합니다.
        (window as any).gtranslateSettings = {
            default_language: 'ko', // 웹사이트의 원본 언어
            detect_browser_language: false, // 브라우저 언어 자동 감지 기능 끄기
            languages: ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'vi', 'id', 'th', 'de', 'ru', 'es', 'it', 'fr'], // 원하는 언어 목록
            horizontal_position: 'right',
            vertical_position: 'top',
        };

        // 2. GTranslate 스크립트를 동적으로 생성하고 body에 추가합니다.
        const script = document.createElement('script');
        script.src = 'https://cdn.gtranslate.net/widgets/latest/float.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        // 3. 컴포넌트가 사라질 때(unmount) 스크립트와 관련 요소를 정리합니다.
        return () => {
            const gtranslateWrapper = document.querySelector('.gtranslate_wrapper');
            if (gtranslateWrapper) {
                gtranslateWrapper.innerHTML = '';
            }
            document.body.removeChild(script);
        };
    }, []); // 빈 배열을 전달하여 이 useEffect가 최초 렌더링 시 단 한 번만 실행되도록 합니다.

    // 이 div는 스크립트가 위젯을 삽입할 위치를 알려주는 용도입니다.
    return <div className="gtranslate_wrapper"></div>;
};

export default TranslateWidget;