import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import Login from "./pages/login/Login";
import PublicRoute from "./components/Route/PublicRoute";
import ProtectedRoute from "./components/Route/ProtectedRoute";
import PostDetail from "./components/postDetail/PostDetail";
import UserDetail from "./pages/userDetail/UserDetail";

// Tạo sẵn các component trang ví dụ
const Dashboard = () => <div className="component-container"></div>;
const CreatePost = () => <div className="component-container"></div>;
const Settings = () => <div className="component-container"></div>;

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
            <Route index element={<Dashboard />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="settings" element={<Settings />} />
            {/* Chi tiết bài đăng + thông tin người dùng */}
            <Route path="products/:id" element={<PostDetail />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="profile" element={<UserDetail />} />
          </Route>
        </Route>

        {/* Chuyển hướng khi lỗi liên kết */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
