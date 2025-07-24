import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

// 1. 상태(State)의 타입을 정의합니다.
// 'token' 슬라이스의 상태 구조를 명확히 합니다.
interface TokenState {
    token: string | null; // JWT 토큰은 문자열이거나 없을 수 있습니다.
    // ✨ 추가: 사용자 프로필 정보
    userProfile: {
        username: string;
        nickname?: string; // 닉네임은 선택 사항일 수 있습니다.
        imageUrl?: string; // 프로필 이미지 URL은 선택 사항일 수 있습니다.
        email?: string; // ✨ 추가: 이메일은 선택 사항일 수 있습니다.
    } | null; // 사용자 프로필 객체이거나 없을 수 있습니다.
}

// 2. 'token' 슬라이스의 초기 상태를 정의합니다.
const initState: TokenState = {
    token: null, // 초기에는 토큰이 없습니다.
    userProfile: null, // ✨ 추가: 초기에는 사용자 프로필도 없습니다.
};

// 3. Redux Toolkit의 createSlice를 사용하여 'token' 슬라이스를 생성합니다.
const tokenSlice = createSlice({
    name: "token", // 슬라이스 이름
    initialState: initState, // 초기 상태
    reducers: {
        // 'setToken' 액션: 상태의 'token' 값을 업데이트합니다.
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload; // 액션의 payload로 전달된 값으로 토큰을 설정합니다.
        },
        // ✨ 추가: 'setUserProfile' 액션: 사용자 프로필 정보를 업데이트합니다.
        setUserProfile: (state, action: PayloadAction<TokenState['userProfile']>) => {
            state.userProfile = action.payload;
        },
        // ✨ 추가: 'clearAuth' 액션: 로그아웃 시 토큰과 프로필 정보를 모두 초기화합니다.
        clearAuth: (state) => {
            state.token = null;
            state.userProfile = null;
        },
    },
});

// 4. configureStore를 사용하여 Redux 스토어를 설정합니다.
// 여기에 애플리케이션의 모든 리듀서가 결합됩니다.
const store = configureStore({
    reducer: {
        token: tokenSlice.reducer, // 'token' 슬라이스의 리듀서를 스토어에 추가합니다.
    },
});

// 5. 스토어의 전체 상태(RootState) 타입을 추론하고 내보냅니다.
// 이 타입은 useSelector 훅 사용 시 타입 안정성을 제공합니다.
export type RootState = ReturnType<typeof store.getState>;

// 6. 스토어의 디스패치(Dispatch) 타입을 추론하고 내보냅니다.
// 이 타입은 useDispatch 훅 사용 시 올바른 타입 체크를 보장합니다.
export type AppDispatch = typeof store.dispatch;

// 7. 'setToken', 'setUserProfile', 'clearAuth' 액션 생성자를 내보냅니다.
export const { setToken, setUserProfile, clearAuth } = tokenSlice.actions;

// 8. 설정된 Redux 스토어 인스턴스를 기본으로 내보냅니다.
export default store;
