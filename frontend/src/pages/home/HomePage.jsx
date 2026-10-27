import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import Footer from '../../components/footer/Footer';
import '../../css/HomePage.css'

const HomePage = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="layout">
      <Header isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="body">
        <Sidebar isOpen={isOpen} />

        {/* Nội dung trang được tự động render vào Outlet */}
        <main className="content">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;