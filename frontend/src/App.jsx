import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EditProductPage from './pages/EditProductPage';
import CreateProductPage from './pages/CreateProductPage'; // <-- Thêm dòng này

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/edit/:id" element={<EditProductPage />} />
        <Route path="/create" element={<CreateProductPage />} /> {/* <-- Thêm dòng này */}
      </Routes>
    </BrowserRouter>
  );
}