import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginPage from "./user/LoginPage";
import NavigationBar from "./navigation/NavigationBar";
import HomePage from "./homepage/HomePage";
import MyPage from "./user/MyPage";
import CalenderPage from "./calender/CalenderPage";
import DetailPage from "./calender/DetailPage";
import CommunityPage from "./community/CommunityPage";
import CompanyPage from "./company/CompanyPage";
import ReviewPage from "./review/ReviewPage";
import SearchPage from "./search/SearchPage";
import Footer from "./footer/Footer";
import {Provider} from "react-redux";
import store from "./store";
import ReviewWritePage from "./review/ReviewWritePage";
import TranslateWidget from "./TranslateWiget";
import LogoutPage from "./user/LogoutPage";
import JoinPage from "./user/JoinPage";
import EditInfoPage from "./user/EditInfoPage";
import ReviewDetailPage from './review/ReviewDetailPage';


function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <TranslateWidget/>
                <Routes>
                    <Route path={'/'} element={<HomePage/>}></Route>
                    <Route element={<NavigationBar/>}>
                        <Route path={'/calender'} element={<CalenderPage/>}></Route>
                        <Route path={"/calender/:festivalId"} element={<DetailPage/>}></Route>
                        <Route path={'/community'} element={<CommunityPage/>}></Route>
                        <Route path={'/company'} element={<CompanyPage/>}></Route>
                        <Route path={'/review'} element={<ReviewPage/>}></Route>
                        <Route path={'/review/write'} element={<ReviewWritePage/>}></Route>
                        <Route path={'/review/detail/:reviewId'} element={<ReviewDetailPage/>}></Route>
                        <Route path={'/search'} element={<SearchPage/>}></Route>
                        <Route path={'/login'} element={<LoginPage/>}></Route>
                        <Route path={'/mypage'} element={<MyPage/>}></Route>
                        <Route path={'/mypage/editinfo'} element={<EditInfoPage/>}></Route>
                        <Route path={'/join'} element={<JoinPage/>}></Route>
                        <Route path={'/logout'} element={<LogoutPage/>}></Route>
                    </Route>
                </Routes>
            </BrowserRouter>
            <Footer/>
        </Provider>
    );
}

export default App;
