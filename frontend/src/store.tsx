import { combineReducers, configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

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
    totalUnreadCount: number; // ✨ 추가: 총 안 읽은 메시지 개수
    lobbyLastUpdated: number | null;
}

// 2. 'token' 슬라이스의 초기 상태를 정의합니다.
const initState: TokenState = {
    token: null, // 초기에는 토큰이 없습니다.
    userProfile: null, // ✨ 추가: 초기에는 사용자 프로필도 없습니다.
    totalUnreadCount: 0, // ✨ 초기값은 0
    lobbyLastUpdated: null as number | null,
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
        // 3. ✨ totalUnreadCount 상태를 업데이트하는 새로운 리듀서를 추가합니다.
        setTotalUnreadCount: (state, action: PayloadAction<number>) => {
            state.totalUnreadCount = action.payload;
        },
        // ✨ 추가: 'clearAuth' 액션: 로그아웃 시 토큰과 프로필 정보를 모두 초기화합니다.
        clearAuth: (state) => {
            state.token = null;
            state.userProfile = null;
            state.totalUnreadCount = 0; // ✨ 초기화
        },
        updateLobby: (state) => {
            state.lobbyLastUpdated = Date.now(); // 현재 시간으로 타임스탬프를 찍어 상태 변경
        },
    },
});

// 영속화 설정
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['token'],
};

// 리듀서 결합
const rootReducer = combineReducers({
    token: tokenSlice.reducer,
});

// 영속화된 리듀서
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 스토어 설정
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;

// 6. 스토어의 디스패치(Dispatch) 타입을 추론하고 내보냅니다.
// 이 타입은 useDispatch 훅 사용 시 올바른 타입 체크를 보장합니다.
export type AppDispatch = typeof store.dispatch;

// 7. 'setToken', 'setUserProfile', 'clearAuth' 액션 생성자를 내보냅니다.
export const { setToken, setUserProfile, clearAuth, setTotalUnreadCount,updateLobby } = tokenSlice.actions;


// 8. 설정된 Redux 스토어 인스턴스를 기본으로 내보냅니다.
export default store;
