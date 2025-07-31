import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store, {persistor} from "./store";
import {PersistGate} from 'redux-persist/integration/react';

// 라우팅에 사용할 페이지 컴포넌트들
import GlobalLayout from "./GlobalLayout"; // ✨ GlocalLayout을 임포트합니다.
import HomePage from "./homepage/HomePage";
import LoginPage from "./user/LoginPage";
import JoinPage from "./user/JoinPage";
import LogoutPage from "./user/LogoutPage";
import MyPage from "./user/MyPage";
import EditInfoPage from "./user/EditInfoPage";
import CalenderPage from "./calender/CalenderPage";
import DetailPage from "./calender/DetailPage";
import CommunityPage from "./community/CommunityPage";
import CompanyPage from "./company/CompanyPage";
import ReviewPage from "./review/ReviewPage";
import SearchPage from "./search/SearchPage";
import ReviewWritePage from "./review/ReviewWritePage";
import ReviewDetailPage from './review/ReviewDetailPage';
import ReviewUpdatePage from './review/ReviewUpdatePage';
import SimpleJoinPage from "./user/SimpleJoinPage";
import SimpleLoginPage from "./user/SimpleLoginPage";
import PasswordChangePage from "./user/PasswordChangePage";
import DeleteAccountPage from "./user/DeleteAccountPage";
import AllRooms from "./community/AllRooms";
import MyRooms from "./community/MyRooms";
import MyReviewsPage from "./user/MyReviewsPage";
import LikedFestivalsPage from "./user/LikedFestivalsPage";

function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={<div>로딩중...</div>} persistor={persistor}>
                <BrowserRouter>
                        <Routes>
                        {/* ✨ GlobalLayout을 사용하는 라우트를 최상위에 배치합니다. */}
                        <Route path="/" element={<GlobalLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="join" element={<JoinPage />} />
                            <Route path="/simplejoin" element={<SimpleJoinPage/>}></Route>
                            <Route path={"userinfo"} element={<SimpleLoginPage/>}></Route>
                            <Route path="logout" element={<LogoutPage />} />
                            <Route path="mypage" element={<MyPage />} />
                            <Route path="mypage/editinfo" element={<EditInfoPage />} />
                            <Route path="mypage/passwordchange" element={<PasswordChangePage/>}></Route>
                            <Route path="mypage/delete-account" element={<DeleteAccountPage />} />
                            <Route path="mypage/my-reviews" element={<MyReviewsPage/>}></Route>
                            <Route path="calender" element={<CalenderPage />} />
                            <Route path="mypage/liked-festivals" element={<LikedFestivalsPage/>}></Route>
                            <Route path="calender/:festivalId" element={<DetailPage />} />
                            <Route path="community" element={<CommunityPage />}>
                                <Route path="all-rooms" element={<AllRooms />} />
                                <Route path="my-rooms" element={<MyRooms />} />
                            </Route>
                            <Route path="company" element={<CompanyPage />} />
                            <Route path="review"  element={<ReviewPage />} />
                            <Route path="review/write" element={<ReviewWritePage />} />
                            <Route path="review/detail/:reviewId" element={<ReviewDetailPage />} />
                            <Route path="review/update/:reviewId" element={<ReviewUpdatePage />} />
                            <Route path="search" element={<SearchPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </PersistGate>
        </Provider>
    );
}

export default App;
