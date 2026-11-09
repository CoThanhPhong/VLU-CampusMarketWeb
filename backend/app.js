const express = require('express');
const cors = require('cors');
const session = require('express-session');
const app = express();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/order');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Tạo một bộ giới hạn (Rate Limiter)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Thời gian tính bằng milliseconds (Ví dụ: 15 phút)
  max: 1000, // Tối đa 1000 request từ 1 IP trong vòng 15 phút
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút!"
  },
  standardHeaders: true, // Trả về thông tin giới hạn trong header `RateLimit-*`
  legacyHeaders: false, // Tắt header `X-RateLimit-*` cũ
});

app.use(cors({
  origin: 'http://localhost:5000', // Thay đổi nếu frontend chạy ở địa chỉ khác
  credentials: true // Cho phép gửi cookie
}));
app.use(session({
  secret: 'VLU-CampusMarket', // Thay đổi thành một chuỗi bí mật mạnh mẽ
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Đặt là true nếu chạy HTTPS, dev thì để false
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
   } // Nếu bạn sử dụng HTTPS, hãy đặt secure: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/checkout', apiLimiter, checkoutRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);

app.get('/', (req, res) => res.send('Backend is running...'));

module.exports = app;