const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus
} = require('../controllers/productController');

// Routes định nghĩa tại tiền tố /api/products
router.route('/c') // Thêm tiền tố /create để tránh xung đột với các route khác
  .post(createProduct);
router.route('/g') // Thêm tiền tố /get để tránh xung đột với các route khác
  .get(getProductById);
router.route('/u') // Thêm tiền tố /update để tránh xung đột với các route khác
  .put(updateProduct);
router.route('/d') // Thêm tiền tố /delete để tránh xung đột với các route khác
  .delete(deleteProduct);
router.route('/update-status') // Thêm route để cập nhật trạng thái sản phẩm
  .put(updateProductStatus);
module.exports = router;