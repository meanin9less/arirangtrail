
import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    AxiosHeaders,
    InternalAxiosRequestConfig
} from "axios";

import store, { setToken } from "../store";

declare module 'axios' {
    export interface AxiosRequestConfig {
        _retry?: boolean; // _retry 속성을 옵셔널한 boolean 타입으로 추가합니다.
    }
}


// 1. Axios 인스턴스를 생성하고 타입을 명시합니다.
const apiClient: AxiosInstance = axios.create({
    baseURL: "http://localhost:8080", // ✨ localhost로 baseURL 변경
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // 크로스 도메인 요청 시 쿠키 전송 허용
    // timeout: 3000, // 필요하다면 주석 해제
});

// 2. 요청 인터셉터 (Request Interceptor) 설정
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // config 객체의 타입을 InternalAxiosRequestConfig로 명시하여 타입 안정성 확보

    // 요청 데이터가 URLSearchParams 타입인지 확인
    if (config.data instanceof URLSearchParams) {
        // headers가 없을 수 있으므로 초기화 (이젠 InternalAxiosRequestConfig 타입이 더 엄격하므로 필요할 수 있습니다)
        config.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    // Redux store에서 JWT 토큰을 가져옵니다.
    const jwtToken = store.getState().token.token;

    // JWT 토큰이 존재하면 요청 헤더에 Authorization을 추가합니다.
    if (jwtToken) {
        config.headers["authorization"] = `${jwtToken}`; // 'Bearer ' 접두사가 필요한 경우 추가: `Bearer ${jwtToken}`
    }

    return config; // 수정된 config 반환
}, (error: AxiosError) => {
    // 요청을 가로채는 중에 에러 발생 시 처리
    console.error("요청 인터셉터 오류:", error);
    return Promise.reject(error);
});

// 3. 응답 인터셉터 (Response Interceptor) 설정
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response, // 성공적인 응답은 그대로 반환
    async (error: AxiosError) => { // ✨ 에러 객체의 타입을 AxiosError로 명시
        const originalRequest = error.config as InternalAxiosRequestConfig; // 타입 단언 (Assertion) 추가

        // 456 상태 코드는 임의로 설정하신 토큰 만료 코드라고 가정합니다.
        // !originalRequest._retry: 무한 루프를 방지하기 위해 재시도 플래그 확인
        if (error.response && error.response.status === 456 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true; // 재시도 플래그를 true로 설정

            try {
                // 토큰 재발급 요청 (리프레시 토큰 사용)
                const response = await axios.post("http://localhost:8080/reissue", null, { // ✨ 재발급 API도 localhost로 변경
                    withCredentials: true,
                });

                // 새로운 액세스 토큰을 응답 헤더에서 가져옵니다. (서버 설정에 따라 다를 수 있음)
                const newAccessToken = response.headers['authorization'];

                if (newAccessToken) {
                    // Redux store에 새로운 액세스 토큰을 저장합니다.
                    store.dispatch(setToken(newAccessToken));
                    console.log("액세스 토큰 재발급 성공 및 Redux Store 업데이트");

                    // 원래 실패했던 요청을 새로운 액세스 토큰으로 재시도합니다.
                    if (originalRequest.headers) { // headers 객체 자체가 존재하는지 확인 (필요 없을 수도 있음)
                        originalRequest.headers['authorization'] = newAccessToken;
                    } else {
                        // InternalAxiosRequestConfig에서는 headers가 거의 항상 존재하지만,
                        // 만약을 대비해 빈 AxiosHeaders 객체로 초기화.
                        originalRequest.headers = new AxiosHeaders(); // AxiosHeaders 생성자를 사용합니다.
                        originalRequest.headers['authorization'] = newAccessToken;
                    }

                    console.log("만료된 요청 재시도");
                    return apiClient(originalRequest); // 재시도된 요청 반환
                } else {
                    console.error("재발급 성공했으나 새로운 토큰이 응답 헤더에 없음.");
                    return Promise.reject(error);
                }

            } catch (refreshError: any) { // 재발급 자체에서 에러 발생 시
                console.error('리프레시 토큰으로 재발급 실패:', refreshError);
                return Promise.reject(refreshError);
            }
        }
        // 토큰 만료(456) 이외의 다른 에러는 그대로 반환
        return Promise.reject(error);
    }
);

// 4. 설정된 apiClient 인스턴스를 내보냅니다.
export default apiClient;