import axios, {
    AxiosInstance,
    AxiosError,
    AxiosHeaders,
    InternalAxiosRequestConfig,
    AxiosResponse
} from "axios";

import store, { setToken } from "../store";

// Axios RequestConfig에 _retry 속성을 추가하여 재시도 여부를 관리합니다.
declare module 'axios' {
    export interface AxiosRequestConfig {
        _retry?: boolean;
    }
}

// 1. Axios 인스턴스를 생성합니다.
const apiClient: AxiosInstance = axios.create({
    // ✨ 변경할 부분: 여기에 백엔드 서버의 실제 주소를 입력하세요.
    // 예: "http://52.78.46.203:8080" 또는 "https://api.yourdomain.com"
    baseURL: "http://localhost:8080/api", // 현재는 localhost:8080
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // 크로스 도메인 요청 시 쿠키 전송 허용 (리프레시 토큰 사용 시 필요)
});

// 2. 요청 인터셉터: 모든 요청에 JWT 토큰을 추가합니다.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // 요청 데이터가 URLSearchParams 타입인 경우 Content-Type을 변경합니다.
    if (config.data instanceof URLSearchParams) {
        config.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    // Redux store에서 JWT 토큰을 가져옵니다.
    const jwtToken = store.getState().token.token;

    // JWT 토큰이 존재하면 Authorization 헤더에 'Bearer' 접두사와 함께 토큰을 추가합니다.
    if (jwtToken) {
        config.headers["Authorization"] = `Bearer ${jwtToken}`;
    }

    return config; // 수정된 요청 설정 반환
}, (error: AxiosError) => {
    // 요청을 보내기 전에 에러 발생 시 처리
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
});

// 3. 응답 인터셉터: 토큰 만료 시 재발급 로직을 처리합니다.
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response, // 성공적인 응답은 그대로 반환
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig;

        // 서버에서 토큰 만료(예: 456 상태 코드) 응답을 받았고, 아직 재시도하지 않은 경우
        // (참고: 456은 사용자 정의 코드이며, 일반적으로 401 Unauthorized를 사용합니다.)
        if (error.response && error.response.status === 456 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true; // 재시도 플래그를 설정하여 무한 루프 방지

            try {
                // 토큰 재발급 요청 (리프레시 토큰은 withCredentials 덕분에 자동으로 전송)
                // ✨ 변경할 부분: 여기에 백엔드 서버의 실제 주소를 입력하세요.
                // 예: "http://52.78.46.203:8080/reissue"
                const response = await axios.post("http://localhost:8080/reissue", null, {
                    withCredentials: true,
                });

                // 새로운 액세스 토큰을 응답 헤더에서 가져옵니다.
                const newAccessToken = response.headers['authorization'];

                if (newAccessToken) {
                    // Redux store에 새로운 액세스 토큰을 저장합니다.
                    store.dispatch(setToken(newAccessToken));

                    // 원래 실패했던 요청을 새로운 액세스 토큰으로 재시도합니다.
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return apiClient(originalRequest); // 재시도된 요청 반환
                } else {
                    console.error("Token reissue successful, but no new token in response header.");
                    return Promise.reject(error);
                }

            } catch (refreshError: any) {
                console.error('Failed to refresh token:', refreshError);
                // 리프레시 토큰 재발급 실패 시 (예: 리프레시 토큰 만료),
                // 사용자에게 재로그인을 요청하거나 로그인 페이지로 리디렉션하는 로직이 필요할 수 있습니다.
                store.dispatch(setToken(null)); // Redux Store 토큰 초기화
                return Promise.reject(refreshError);
            }
        }
        // 토큰 만료(456) 이외의 다른 에러는 그대로 반환
        return Promise.reject(error);
    }
);

// 4. 설정된 apiClient 인스턴스를 내보냅니다.
export default apiClient;
