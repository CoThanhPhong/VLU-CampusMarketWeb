const Product = require('../models/product');

// 1. CREATE: Tạo mới hoặc lưu sản phẩm
const createProduct = async (req, res) => {
  try {
    const data = req.body;
    
    // Nếu client gửi lên một mảng đối tượng sản phẩm hoặc một đối tượng đơn lẻ
    if (Array.isArray(data)) {
      const newProducts = await Product.insertMany(data);
      return res.status(201).json({
        success: true,
        message: `Tạo ${newProducts.length} sản phẩm thành công`,
        data: newProducts
      });
    } else {
      // Trường hợp tạo mới hoặc cập nhật cộng dồn đơn lẻ từ form
      // Kiểm tra nếu có _id thì tiến hành update/upsert, nếu không thì tạo mới
      let savedProduct;
      if (data._id) {
        savedProduct = await Product.findByIdAndUpdate(data._id, data, { new: true, runValidators: true, upsert: true });
      } else {
        const newProduct = new Product(data);
        savedProduct = await newProduct.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Lưu sản phẩm thành công',
        data: savedProduct
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Tạo sản phẩm thất bại\n${error.message}`
    });
  }
};

// 2. READ (Single/All): Lấy danh sách sản phẩm hoặc chi tiết một sản phẩm
const getProductById = async (req, res) => {
  try {
    let product;
    let totalProducts = 0;

    if (!req.body || Object.keys(req.body).length === 0 || !req.body._id) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Xây dựng điều kiện lọc (Query Filter) động
      let filter = {
        amount: { $gt: 0 },          // Chỉ lấy sản phẩm còn số lượng > 0
        status: { $ne: 'Hết hàng' }  // Loại bỏ sản phẩm hết hàng
      };

      // Nếu có từ khóa tìm kiếm theo tên
      if (req.query.search && req.query.search.trim() !== '') {
        filter.name = { $regex: req.query.search.trim(), $options: 'i' };
      }

      // Nếu có lọc theo loại thiết bị
      if (req.query.category && req.query.category !== 'all') {
        filter.deviceType = req.query.category;
      }

      // Nếu có lọc theo cơ sở
      if (req.query.local && req.query.local !== 'all') {
        filter.local = req.query.local;
      }

      // Đếm tổng số sản phẩm thỏa mãn điều kiện lọc
      totalProducts = await Product.countDocuments(filter);

      // Truy vấn sản phẩm theo điều kiện, phân trang và sắp xếp mới nhất
      product = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'author',
          populate: { path: 'profile' }
        });

      return res.status(200).json({ 
        success: true, 
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit) || 1,
        totalProducts: totalProducts,
        count: product.length, 
        data: product 
      });

    } else {
      // Trường hợp lấy chi tiết 1 sản phẩm theo _id
      product = await Product.findById(req.body._id).populate({
        path: 'author',
        populate: { path: 'profile' }
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }

      return res.status(200).json({ count: 1, success: true, data: product });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. UPDATE: Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
  try {
    const productId = req.body._id || req.params.id;
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
    }
    res.status(200).json({ 
      success: true, 
      message: `Cập nhật sản phẩm thành công!`, 
      data: updatedProduct 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. DELETE: Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
  try {
    const productId = req.body._id || req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa' });
    }
    res.status(200).json({ success: true, message: `Xóa sản phẩm thành công` });
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