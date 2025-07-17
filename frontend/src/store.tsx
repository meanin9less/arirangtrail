import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

// 1. 상태(State)의 타입을 정의합니다.
// 이 인터페이스는 'initState'의 구조를 명확히 합니다.
interface TokenState {
    token: string | null; // 토큰은 문자열이거나 없을 수 있으므로 'string | null'로 정의
}

// 2. 초기 상태를 정의할 때 위에서 정의한 타입을 명시합니다.
const initState: TokenState = {
    token: null,
};

// 3. createSlice를 정의할 때, 제네릭으로 상태 타입을 전달합니다.
const tokenSlice = createSlice({
    name: "token",
    initialState: initState,
    reducers: {
        // 4. 'setToken' 액션의 리듀서에서 'action'의 타입을 정의합니다.
        // PayloadAction<T>는 Redux Toolkit에서 페이로드를 가진 액션을 위한 타입입니다.
        // T는 액션의 payload 타입입니다. 여기서는 'string'입니다.
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
    },
});

// 5. 스토어의 전체 상태(RootState) 타입을 추론하고 내보냅니다.
// 이렇게 하면 useSelector를 사용할 때 타입 힌트를 받을 수 있습니다.
export type RootState = ReturnType<typeof store.getState>;

// 6. 스토어의 디스패치(Dispatch) 타입을 정의하고 내보냅니다.
// 이렇게 하면 useDispatch를 사용할 때 올바른 타입 체크를 받을 수 있습니다.
export type AppDispatch = typeof store.dispatch;


const store = configureStore({
    reducer: {
        token: tokenSlice.reducer,
    },
});

export const { setToken } = tokenSlice.actions;
export default store;