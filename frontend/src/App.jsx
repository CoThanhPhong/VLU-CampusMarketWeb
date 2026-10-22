import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PostDetailPage from "./pages/PostDetailPage";
import UserProfilePage from "./pages/UserProfilePage";
import { ErrorState } from "./components/StateViews";
import "./styles/campus.css";

// Ví dụ định tuyến. Nhóm đã có App.jsx thì chỉ cần chép 3 dòng <Route> bên dưới vào.
export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/products/6ace1ce78429535964d00001" replace />} />
          <Route path="/products/:id" element={<PostDetailPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="*" element={<ErrorState error={{ status: 404, message: "Trang bạn tìm không tồn tại." }} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
