const jwt = require("jsonwebtoken");
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const UserInfo = require("../middleware/userInfo");

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

    // Truyền thêm password vào UserInfo để phục vụ việc tạo mới user nếu chưa có trong DB
    const user = await UserInfo(client, mssv, password);

    const token = jwt.sign(
      { id: user._id, mssv: mssv }, // Payload chứa id của user để findById ở profile
      process.env.JWT_SECRET || "VLU_SECRET_KEY",
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      token: token,
      message: "Đăng nhập thành công qua hệ thống VLU và đã đồng bộ thông tin!",
    });
  } catch (error) {
    console.error("Lỗi external login:", error.message);
    return res
      .status(500)
      .json({ message: "Lỗi server kết nối trang VLU: " + error.message });
  }
};
