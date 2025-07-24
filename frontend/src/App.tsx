import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";

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
import ReviewWritePage from "./review/ReviewWritePage";
import ReviewDetailPage from './review/ReviewDetailPage';
import SearchPage from "./search/SearchPage";

function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    {/* ✨ GlobalLayout을 사용하는 라우트를 최상위에 배치합니다. */}
                    <Route path="/" element={<GlobalLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="join" element={<JoinPage />} />
                        <Route path="logout" element={<LogoutPage />} />
                        <Route path="mypage" element={<MyPage />} />
                        <Route path="mypage/editinfo" element={<EditInfoPage />} />
                        <Route path="calender" element={<CalenderPage />} />
                        <Route path="calender/:festivalId" element={<DetailPage />} />
                        <Route path="community" element={<CommunityPage />} />
                        <Route path="company" element={<CompanyPage />} />
                        <Route path="review"
                               element={<ReviewPage />} />
                        <Route path="review/write" element={<ReviewWritePage />} />
                        <Route path="review/detail/:reviewId" element={<ReviewDetailPage />} />
                        <Route path="search" element={<SearchPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </Provider>
    );
}

export default App;