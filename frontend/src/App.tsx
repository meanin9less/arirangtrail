import React from 'react';
import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginPage from "./LoginPage";
import NavigationBar from "./NavigationBar";
import HomePage from "./HomePage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/'} element={<NavigationBar/>}>
            <Route index element={<HomePage/>}></Route>
            <Route path={'/login'} element={<LoginPage/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
