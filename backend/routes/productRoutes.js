const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/verifyToken');
const {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus
} = require('../controllers/productController');

const authorizeAdminQuery = (req, res, next) => {
  if (req.query.isAdmin !== 'true') return next();
  return verifyToken(req, res, () => isAdmin(req, res, next));
};

// Routes định nghĩa tại tiền tố /api/products
router.route('/c') // Thêm tiền tố /create để tránh xung đột với các route khác
  .post(verifyToken, createProduct);
router.route('/g') // Thêm tiền tố /get để tránh xung đột với các route khác
  .get(authorizeAdminQuery, getProductById);
router.route('/g') // Thêm tiền tố /get để tránh xung đột với các route khác
  .post(authorizeAdminQuery, getProductById);
router.route('/u') // Thêm tiền tố /update để tránh xung đột với các route khác
  .put(verifyToken, updateProduct);
router.route('/d') // Thêm tiền tố /delete để tránh xung đột với các route khác
  .delete(verifyToken, deleteProduct);
router.route('/update-status') // Thêm route để cập nhật trạng thái sản phẩm
  .put(verifyToken, isAdmin, updateProductStatus);
module.exports = router;