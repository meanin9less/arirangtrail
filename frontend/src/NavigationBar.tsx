import React from 'react';
import {Outlet} from "react-router-dom";

interface NaviProps{

}

const NavigationBar = ({}: NaviProps)=> {

    return(
        <>
            <h1>네비게이션 바</h1>
            <Outlet></Outlet>
        </>
    );
}

export default NavigationBar;