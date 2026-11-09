const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const orderController = require('../controllers/orderController');

// 1. Tạo đơn hàng mới (Từ CheckoutPage)
router.post('/c', verifyToken, orderController.createOrder);

// 2. Lấy danh sách đơn hàng của user (Dành cho OrderListPage)
router.get('/g', verifyToken, orderController.getMyOrders);

// 3. Hủy đơn hàng
router.put('/cancel', verifyToken, orderController.cancelOrder);

module.exports = router;