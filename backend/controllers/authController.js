const jwt = require("jsonwebtoken");
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const UserInfo = require("../middleware/userInfo");
const User = require("../models/User");

exports.login = async (req, res) => {
  try {
    const { mssv, password } = req.body;
    if (!mssv || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    const payload = new URLSearchParams({
      txtTaiKhoan: mssv,
      txtMatKhau: password,
    });

    const loginUrl = "https://online.vlu.edu.vn/Login";
    const loginResponse = await client.post(loginUrl, payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const responseText = loginResponse.data;

    const hasError =
      responseText.includes("Tên đăng nhập hoặc mật khẩu không chính xác") ||
      responseText.includes(
        "T&#234;n đăng nhập hoặc mật khẩu kh&#244;ng ch&#237;nh x&#225;c",
      );

    if (hasError) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }

    // 1. Lấy hoặc tạo mới user từ hệ thống VLU
    const user = await UserInfo(client, mssv, password);
<<<<<<< HEAD
    // 2. QUAN TRỌNG: Populate thông tin profile để lấy avatar gửi về cho Frontend
    const populatedUser = await User.findById(user._id).populate('profile');
=======

    // 2. Populate thông tin profile để lấy avatar gửi về cho Frontend
    const populatedUser = await User.findById(user.id).populate('profile');
>>>>>>> feature/update-ui-sam

    const token = jwt.sign(
      { id: user.id, mssv: mssv, role: user.role }, 
      process.env.JWT_SECRET || "VLU_SECRET_KEY", 
      { expiresIn: "1d" },
    );

    // --- 3. LƯU TOKEN VÀO COOKIE ---
    res.cookie("token", token, {
      httpOnly: true, // Ngăn chặn JavaScript phía client đọc cookie (Chống XSS)
      secure: process.env.NODE_ENV === "production", // true nếu chạy trên HTTPS (production)
      sameSite: "lax", // Hoặc 'strict' tùy theo cấu hình CORS của bạn
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày (tính bằng milliseconds)
    });
<<<<<<< HEAD
    // 3. Trả về cả token VÀ object user (đã có profile chứa avatar)
    return res.status(200).json({
      success: true,
      user: {
        id: populatedUser._id,
=======

    // 4. Trả về response (đã lược bỏ token trong json body vì đã lưu vào cookie)
    return res.status(200).json({
      success: true,
      user: {
        id: populatedUser.id,
>>>>>>> feature/update-ui-sam
        mssv: populatedUser.mssv,
        email: populatedUser.email,
        role: populatedUser.role,
        profile: populatedUser.profile
      },
      message: "Đăng nhập thành công qua hệ thống VLU và đã đồng bộ thông tin!",
    });
  } catch (error) {
    console.error("Lỗi external login:", error.message);
    return res
      .status(500)
      .json({ message: "Lỗi server kết nối trang VLU: " + error.message });
  }
};

// Ví dụ trong file AuthController.js (Node.js / Express)
exports.logout = async (req, res) => {
  try {
    // Xóa cookie bằng cách thiết lập giá trị rỗng và thời gian sống (maxAge) bằng 0 hoặc quá khứ
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};