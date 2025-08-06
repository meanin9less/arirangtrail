export interface Emoticon {
    id: string;
    name: string;
    localSrc: string; // UI 표시에 사용될 로컬 경로
    s3Url: string;    // 서버로 전송될 실제 이미지 URL
}

export const EMOTICONS: Emoticon[] = [
    {
        id: 'good-1',
        name: 'good',
        localSrc: '/assets/imoticon/good.png', // public 폴더 기준 경로입니다.
        s3Url: 'https://arirangtrailchatfile.s3.ap-northeast-2.amazonaws.com/1d337240-5f60-4f66-9e6e-b06b34bc302e.png',
    },
    {
        id: 'bad-1',
        name: 'bad',
        localSrc: '/assets/imoticon/bad.png',
        s3Url: 'https://arirangtrailchatfile.s3.ap-northeast-2.amazonaws.com/2cd02610-a269-4ff2-bdc5-d78eb7315ff2.png',
    },
    {
        id: 'happy-1',
        name: 'happy',
        localSrc: '/assets/imoticon/happy.png',
        s3Url: 'https://arirangtrailchatfile.s3.ap-northeast-2.amazonaws.com/fadaca76-7462-4e2d-afdd-d1098ad1a87c.png',
    },
    {
        id: 'love-1',
        name: 'love',
        localSrc: '/assets/imoticon/love.png',
        s3Url: 'https://arirangtrailchatfile.s3.ap-northeast-2.amazonaws.com/7dd5a312-d1e9-4adc-b9ee-f2029ca95a04.png',
    },
    {
        id: 'smile-1',
        name: 'smile',
        localSrc: '/assets/imoticon/smile.png',
        s3Url: 'https://arirangtrailchatfile.s3.ap-northeast-2.amazonaws.com/05b3ddaa-19bc-4751-96a0-038f00573eb7.png',
    },
    {
        id: 'sad-1',
        name: 'sad',
        localSrc: '/assets/imoticon/sad.png',
        s3Url: 'https://arirangtrailchatfile.s3.ap-northeast-2.amazonaws.com/23016fc8-26f3-4e2d-ac0d-a239d67ee33f.png',
    },
];