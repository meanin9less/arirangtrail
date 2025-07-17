import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginPage from "./user/LoginPage";
import NavigationBar from "./navigation/NavigationBar";
import HomePage from "./HomePage";
import MyPage from "./user/MyPage";
import SignUpPage from "./user/SignUpPage";
import CalenderPage from "./calender/CalenderPage";
import DetailPage from "./calender/DetailPage";
import CommunityPage from "./community/CommunityPage";
import CompanyPage from "./company/CompanyPage";
import ReviewPage from "./review/ReviewPage";
import SearchPage from "./search/SearchPage";
import Footer from "./footer/Footer";
import {Provider} from "react-redux";
import store from "./store";

function App() {
  return (
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path={'/'} element={<NavigationBar/>}>
                <Route index element={<HomePage/>}></Route>
                <Route path={'/calender'} element={<CalenderPage/>}></Route>
              <Route path={"/calender/:festivalId"} element={<DetailPage/>}></Route>
                <Route path={'/community'} element={<CommunityPage/>}></Route>
                <Route path={'/company'} element={<CompanyPage/>}></Route>
                <Route path={'/review'} element={<ReviewPage/>}></Route>
                <Route path={'/search'} element={<SearchPage/>}></Route>
                <Route path={'/login'} element={<LoginPage/>}></Route>
                <Route path={'/mypage'} element={<MyPage/>}></Route>
                <Route path={'/signup'} element={<SignUpPage/>}></Route>
            </Route>
          </Routes>
        </BrowserRouter>
          <Footer />
      </Provider>
  );
}

export default App;
