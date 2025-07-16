import React from 'react';
import {Link, Outlet} from "react-router-dom";

interface NaviProps{

}

const NavigationBar = ({}: NaviProps)=> {

    return(
        <>
            <nav style={{backgroundColor: 'gray'}}>
                <Link to={"/"}>홈</Link>
                <Link to={"/calender"}>캘린더</Link>
                <Link to={"/search"}>지역검색</Link>
                <Link to={"/review"}>축제후기</Link>
                <Link to={"/community"}>커뮤니티</Link>
                <Link to={"/company"}>회사소개</Link>
                <Link to={"/login"}>로그인</Link>
            </nav>
            <Outlet></Outlet>
        </>
    );
}

export default NavigationBar;