import { combineReducers, configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

// 1. 상태(State)의 타입을 정의합니다.
interface TokenState {
    token: string | null;
    userProfile: {
        username: string;
        nickname?: string;
        imageurl?: string; // ✨ imageUrl -> imageurl (소문자로 변경)
        email?: string;
        firstname?: string; // EditInfoPage에서 전달하는 정보에 맞춰 추가
        lastname?: string; // EditInfoPage에서 전달하는 정보에 맞춰 추가
        birthdate?: string; // EditInfoPage에서 전달하는 정보에 맞춰 추가
    } | null;
    totalUnreadCount: number;
    lobbyLastUpdated: number | null;
}

// 2. 'token' 슬라이스의 초기 상태를 정의합니다.
const initState: TokenState = {
    token: null,
    userProfile: null,
    totalUnreadCount: 0,
    lobbyLastUpdated: null as number | null,
};

// 3. Redux Toolkit의 createSlice를 사용하여 'token' 슬라이스를 생성합니다.
const tokenSlice = createSlice({
    name: "token",
    initialState: initState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
            if (action.payload) {
                localStorage.setItem('jwtToken', action.payload);
            } else {
                localStorage.removeItem('jwtToken');
                state.userProfile = null; // 토큰 제거 시 프로필도 초기화
            }
        },
        // ✨ 'setUserProfile' 액션: 사용자 프로필 정보를 업데이트합니다.
        setUserProfile: (state, action: PayloadAction<TokenState['userProfile']>) => {
            state.userProfile = action.payload;
        },
        setTotalUnreadCount: (state, action: PayloadAction<number>) => {
            state.totalUnreadCount = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.userProfile = null;
            state.totalUnreadCount = 0;
        },
        updateLobby: (state) => {
            state.lobbyLastUpdated = Date.now();
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
export type AppDispatch = typeof store.dispatch;

export const { setToken, setUserProfile, clearAuth, setTotalUnreadCount,updateLobby } = tokenSlice.actions;

export default store;
