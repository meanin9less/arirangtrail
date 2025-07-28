import React, {useEffect, useRef, useState} from 'react';

// 카카오 SDK 타입을 위한 전역 선언
declare global {
    interface Window {
        Kakao: any;
    }
}

interface ShareData {
    title?: string;
    text?: string;
    url: string;
    imageUrl?: string; // 카카오톡 공유 시 사용할 이미지 URL
}

interface ShareApiProps {
    shareData: ShareData;
    children: React.ReactNode;
    className?: string;
}

const KAKAO_KEY = "81894ae6bf6a5f8cada24d9ee0e9f488";
const isMobile = /Mobi/i.test(window.navigator.userAgent);

const ShareApi = ({shareData, children, className}: ShareApiProps) => {
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isNativeShareSupported = !!navigator.share;

    // 카카오 SDK 초기화를 위한 useEffect
    useEffect(() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(KAKAO_KEY);
        }
    }, []);

    const handleNativeShare = async () => {
        if (!navigator.share) return;
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.error("네이티브 공유 실패:", error);
        }
        setShowMoreOptions(false); // 메뉴 닫기
    };

    const shareToKakao = () => {
        if (!window.Kakao) return;
        window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: shareData.title || '재미있는 축제 정보',
                description: shareData.text,
                imageUrl: shareData.imageUrl || 'https://via.placeholder.com/800x400.png?text=Festival',
                link: {mobileWebUrl: shareData.url, webUrl: shareData.url},
            },
            buttons: [{title: '자세히 보기', link: {mobileWebUrl: shareData.url, webUrl: shareData.url}}],
        });
        setShowMoreOptions(false); // 메뉴 닫기
    };

    const copyUrlToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareData.url);
            alert('페이지 주소가 클립보드에 복사되었습니다.');
        } catch (err) {
            alert('주소 복사에 실패했습니다.');
        }
        setShowMoreOptions(false); // 메뉴 닫기
    };

    //  메인 공유 버튼의 역할은 오직 '메뉴를 켜고 끄는 것'으로 단순화
    const handleToggleMenu = () => {
        setShowMoreOptions(prev => !prev);
    };

    const handleShare = async () => {
        // navigator.share가 존재하고, "동시에 모바일 환경일 때만" 네이티브 공유창을 사용합니다.
        if (navigator.share && isMobile) {
            await navigator.share(shareData);
        } else {
            // PC 환경이거나, navigator.share를 지원하지 않으면 무조건 우리가 만든 메뉴를 띄웁니다.
            setShowMoreOptions(prev => !prev);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowMoreOptions(false);
            }
        };
        if (showMoreOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMoreOptions]);

    return (
        <div ref={wrapperRef} className="share-wrapper">
            <button onClick={handleToggleMenu} className={className}>
                {children}
            </button>

            {showMoreOptions && (
                <div className="share-options-menu">
                    {/* 네이티브 공유를 지원하는 브라우저에서만 이 버튼이 보이도록 조건부 렌더링 */}
                    {isNativeShareSupported && (
                        <button onClick={handleNativeShare} className="share-option-button">
                            전체 공유
                        </button>
                    )}

                    <button onClick={shareToKakao} className="share-option-button">
                        카카오톡 공유
                    </button>
                    <button onClick={copyUrlToClipboard} className="share-option-button">
                        URL 복사
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShareApi;