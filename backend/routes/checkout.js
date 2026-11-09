const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const Product = require('../models/product');

// Validate thông tin checkout và kiểm tra tồn kho trước khi đặt hàng
router.post('/validate', verifyToken, async (req, res) => {
  try {
    const { orderItems } = req.body;
    
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Sản phẩm không tồn tại` });
      }
      if (product.amount < item.quantity) {
        return res.status(400).json({ success: false, message: `Sản phẩm ${product.name} không đủ số lượng trong kho.` });
      }
    }

    res.status(200).json({ success: true, message: 'Giỏ hàng hợp lệ, sẵn sàng thanh toán' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;