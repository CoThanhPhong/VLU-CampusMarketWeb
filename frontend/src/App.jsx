import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import Login from "./pages/login/Login";
import PublicRoute from "./components/Route/PublicRoute";
import ProtectedRoute from "./components/Route/ProtectedRoute";
import Settings from "./pages/settings/setting";
import SettingProfile from "./pages/settings/profile";
import PostDetail from "./pages/postDetail/PostDetail";
import UserDetail from "./pages/userDetail/UserDetail";

// 1. Import các trang bạn vừa làm (Nhớ kiểm tra lại đường dẫn cho chuẩn xác với máy bạn)
import CartPage from "./pages/cart/cartPage";
import OrderListPage from "./pages/order/ordersPage";
import CheckoutPage from "./components/checkout/checkoutPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Chưa login sẽ chuyển hướng đăng nhập */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Sau khi login sẽ hiển thị */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />}>
            {/* Tự động chuyển hướng trang gốc "/" sang "/home" để không bị màn hình trắng */}
            <Route index element={<Navigate to="/home" replace />} />
            
            {/* 2. Thay thế Dashboard giả bằng ProductList (Danh sách sản phẩm) của bạn */}
            <Route path="/home" element={<ProductList />} />
            
            {/* 3. Thay thế CreatePost giả bằng Form đăng bài của bạn */}
            <Route path="/create-post" element={<CreateProductPage />} />
            <Route path="/orders" element={<OrderListPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            
            {/* 4. Thêm sẵn Route cho trang Chi tiết sản phẩm (để click vào thẻ không bị lỗi) */}
            {/* <Route path="/product/:id" element={<ProductDetailPage />} /> */}
            
            {/* Ví dụ tạo pages/settings/settings.jsx */}
            {/* B1: Thêm vào sidebar.jsx */}
            {/* B2: Thêm vào Route như bên dưới */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/settingProfile" element={<SettingProfile />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/user/:id" element={<UserDetail />} />
          </Route>
        </Route>

        {/* Chuyển hướng khi lỗi liên kết */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
