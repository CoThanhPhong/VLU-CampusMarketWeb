// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const cartController = require('../controllers/cartController');

// Route lấy giỏ hàng: GET /api/cart/g
router.get('/g', verifyToken, cartController.getCart);

// Route đồng bộ/cập nhật giỏ hàng: POST /api/cart/u
router.post('/u', verifyToken, cartController.updateCart);

module.exports = router;