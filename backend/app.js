const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/order');

app.use(cors({
  origin: 'http://localhost:5000', // Thay đổi nếu frontend chạy ở địa chỉ khác
  credentials: true // Cho phép gửi cookie
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => res.send('Backend is running...'));

module.exports = app;