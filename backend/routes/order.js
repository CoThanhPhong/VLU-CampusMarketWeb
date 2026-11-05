const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const componentLogger = require('../middleware/componentLogger');
const Order = require('../models/order');
const Product = require('../models/product');
const orderController = require('../controllers/orderController');

// 1. Tạo đơn hàng mới (Từ CheckoutPage)
router.post('/c', verifyToken, componentLogger('CheckoutPage'), orderController.createOrder);

// 2. Lấy danh sách đơn hàng của user (Dành cho OrderListPage)
router.get('/g', verifyToken, componentLogger('OrderListPage'), orderController.getMyOrders);

// 3. Hủy đơn hàng
router.put('/cancel', verifyToken, componentLogger('OrderListPage'), orderController.cancelOrder);

module.exports = router;