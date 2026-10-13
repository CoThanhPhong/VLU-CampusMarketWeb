const Product = require('../models/product');

// 1. CREATE: Tạo mới sản phẩm
const createProduct = async (req, res) => {
  try {
    const data = req.body;
    const newProducts = await Product.insertMany(data);
    return res.status(201).json({
      success: true,
      message: `Tạo ${newProducts.length} sản phẩm thành công`,
      data: newProducts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Tạo sản phẩm thất bại\n${error.message}`
    });
  }
};

// 2. READ (Single): Lấy thông tin một sản phẩm theo ID hoặc danh sách sản phẩm
const getProductById = async (req,res) => {
  try {
    let product;
    if (req.body == undefined) {
      product = await Product.find({});
    } else {
      product = await Product.findById(req.body._id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }
    }
    res.status(200).json({ count: product.length, success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. UPDATE: Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.body._id,
      req.body,
      { new: true, runValidators: true } // Trả về dữ liệu mới sau khi cập nhật
    );
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
    }
    res.status(200).json({ success: true, message: `Cập nhật ${updateProduct.name} thành công!`, data: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. DELETE: Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.body._id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa' });
    }
    res.status(200).json({ success: true, message: `Xóa ${deletedProduct.name} thành công`});
  } catch (error) {
    res.status(500).json({ success: false, message: `Xóa sản phẩm thất bại! Lỗi: ${error.message}` });
  }
};

module.exports = {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct
};