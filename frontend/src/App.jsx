import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import Login from "./pages/login/Login";
import PublicRoute from "./components/Route/PublicRoute";
import ProtectedRoute from "./components/Route/ProtectedRoute";
import Settings from "./pages/settings/setting";
import SettingProfile from "./pages/settings/profile";

// Tạo sẵn các component trang ví dụ để không bị lỗi
const Dashboard = () => <div className="component-container"></div>;
const CreatePost = () => <div className="component-container"></div>;

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
            <Route path="/home" element={<Dashboard />} />
            <Route path="/create-post" element={<CreatePost />} />
            {/* Ví dụ tạo pages/settings/settings.jsx */}
            {/* B1: Thêm vào sidebar.jsx */}
            {/* B2: Thêm vào Route như bên dưới */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/settingProfile" element={<SettingProfile />} />
          </Route>
        </Route>

        {/* Chuyển hướng khi lỗi liên kết */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
