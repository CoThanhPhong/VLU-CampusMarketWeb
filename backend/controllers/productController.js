const Product = require('../models/productModel');

// 1. CREATE: Tạo mới sản phẩm
const createProduct = async (req, res) => {
  try {
    const data = req.body;
    if (Array.isArray(data)) {
      const newProducts = await Product.insertMany(data);
      return res.status(201).json({
        success: `Tạo ${newProducts.length} sản phẩm thành công`,
        data: newProducts
      });
    }
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json({
      success: `Tạo 1 sản phẩm thành công`,
      data: savedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: "Tạo sản phẩm thất bại",
      message: error.message
    });
  }
};

// 2. READ (All): Lấy danh sách tất cả sản phẩm
const getProducts = async (res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. READ (Single): Lấy thông tin một sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. UPDATE: Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Trả về dữ liệu mới sau khi cập nhật
    );
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
    }
    res.status(200).json({ success: `Cập nhật ${updatedProduct.name} thành công`, data: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: "Cập nhật sản phẩm thất bại", message: error.message });
  }
};

// 5. DELETE: Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa' });
    }
    res.status(200).json({ success: `Xóa ${deletedProduct.name} thành công`, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: "Xóa sản phẩm thất bại", message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};