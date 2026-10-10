const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Routes định nghĩa tại tiền tố /api/products
router.route('/getAll') // Thêm tiền tố /getAll để tránh xung đột với các route khác
  .get(getProducts);
router.route('/c') // Thêm tiền tố /create để tránh xung đột với các route khác
  .post(createProduct);
router.route('/g/:id') // Thêm tiền tố /get để tránh xung đột với các route khác
  .get(getProductById);
router.route('/u/:id') // Thêm tiền tố /update để tránh xung đột với các route khác
  .put(updateProduct);
router.route('/d/:id') // Thêm tiền tố /delete để tránh xung đột với các route khác
  .delete(deleteProduct);

module.exports = router;