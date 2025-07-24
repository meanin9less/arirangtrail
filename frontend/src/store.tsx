import { combineReducers, configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

// 상태 타입 정의
interface TokenState {
    token: string | null;
    userProfile: { username: string; nickname?: string; imageUrl?: string; email?: string } | null;
}

// 초기 상태
const initialState: TokenState = {
    token: null,
    userProfile: null,
};

// token 슬라이스 생성
const tokenSlice = createSlice({
    name: 'token',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setUserProfile: (state, action: PayloadAction<TokenState['userProfile']>) => {
            state.userProfile = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.userProfile = null;
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
export const { setToken, setUserProfile, clearAuth } = tokenSlice.actions;
export default store;