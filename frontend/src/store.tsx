import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// 사용자 프로필 정보 인터페이스 (백엔드 UserDTO와 일치하도록 정의)
interface UserProfile {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    nickname: string;
    birthdate: string; // YYYY-MM-DD 형식의 문자열
    imageurl?: string; // ✨ imageUrl -> imageurl (소문자로 변경)
}

// 초기 상태 정의
interface AuthState {
    token: string | null;
    userProfile: UserProfile | null;
}

const initialState: AuthState = {
    token: localStorage.getItem('jwtToken') || null, // 로컬 스토리지에서 토큰 불러오기
    userProfile: null, // 초기에는 사용자 프로필 없음
};

// 인증 슬라이스 생성
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
            if (action.payload) {
                localStorage.setItem('jwtToken', action.payload); // 토큰 저장
            } else {
                localStorage.removeItem('jwtToken'); // 토큰 삭제
            }
        },
        setUserProfile: (state, action: PayloadAction<UserProfile | null>) => {
            state.userProfile = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.userProfile = null;
            localStorage.removeItem('jwtToken'); // 토큰 삭제
        },
    },
});

// 액션과 리듀서 내보내기
export const { setToken, setUserProfile, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// 스토어 설정
export const store = configureStore({
    reducer: {
        token: authSlice.reducer, // 'token'이라는 이름으로 authSlice의 리듀서를 등록
    },
});

// RootState 타입 정의 (모든 슬라이스의 상태를 포함)
export type RootState = ReturnType<typeof store.getState>;
// AppDispatch 타입 정의 (디스패치 함수 타입)
export type AppDispatch = typeof store.dispatch;
