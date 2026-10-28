const User = require('../models/User'); // Có thể giữ hoặc bỏ nếu không dùng DB nữa
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

exports.login = async (req, res) => {
  try {
    // 1. Nhận mssv/username và password từ React gửi lên
    const { mssv, password } = req.body;
    if (!mssv || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // 2. Tạo CookieJar để duy trì Session (giống requests.Session trong Python)
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    // 3. Chuẩn bị payload dạng form-urlencoded (data=payload)
    const payload = new URLSearchParams({
      txtTaiKhoan: mssv, // Hoặc username tùy theo trang ngoài
      txtMatKhau: password
    });

    const loginUrl = 'https://online.vlu.edu.vn/Login';

    // 4. Gửi request POST đăng nhập sang trang ngoài
    const loginResponse = await client.post(loginUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const responseText = loginResponse.data; // Tương đương login.text trong Python

    // 5. Kiểm tra thông báo lỗi (hỗ trợ cả text thường lẫn HTML entities)
    const hasError = 
      responseText.includes('Tên đăng nhập hoặc mật khẩu không chính xác') || 
      responseText.includes('T&#234;n đăng nhập hoặc mật khẩu kh&#244;ng ch&#237;nh x&#225;c');

    if (hasError) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // --- ĐĂNG NHẬP TRANG NGOÀI THÀNH CÔNG ---
    // (Tùy chọn) Bạn có thể tạo một JWT token cục bộ của ứng dụng MERN để trả về cho React lưu trữ
    const token = jwt.sign(
      { mssv: mssv }, 
      process.env.JWT_SECRET || 'changeme', 
      { expiresIn: '1d' }
    );

    return res.status(200).json({ 
      message: 'Đăng nhập thành công qua hệ thống VLU!' 
    });

  } catch (error) {
    console.error('Lỗi external login:', error.message);
    return res.status(500).json({ message: 'Lỗi server kết nối trang VLU: ' + error.message });
  }
};