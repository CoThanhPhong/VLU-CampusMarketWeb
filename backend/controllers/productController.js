const Product = require('../models/product');

// 1. CREATE: Tạo mới hoặc lưu sản phẩm
const createProduct = async (req, res) => {
  try {
    const data = req.body;
    
    if (Array.isArray(data)) {
      const formattedData = data.map(item => ({
        ...item,
        status: item.status || 'Chờ duyệt',
        startDate: item.startDate || new Date().toISOString()
      }));
      const newProducts = await Product.insertMany(formattedData);
      return res.status(201).json({
        success: true,
        message: `Tạo ${newProducts.length} sản phẩm thành công`,
        data: newProducts
      });
    } else {
      let savedProduct;
      if (data._id) {
        savedProduct = await Product.findByIdAndUpdate(data._id, data, { returnDocument: 'after', runValidators: true, upsert: true });
      } else {
        const productData = {
          ...data,
          status: data.status || 'Chờ duyệt',
          startDate: new Date().toISOString()
        };
        const newProduct = new Product(productData);
        savedProduct = await newProduct.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Đăng bài thành công, đang chờ Admin duyệt!',
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

      let filter = {};
      const isAdminRequest = req.query.isAdmin === 'true';

      if (!isAdminRequest) {
        filter.amount = { $gt: 0 };
        filter.status = { $in: ['Còn hàng', 'Đã duyệt'] };
      }

      // --- [BỔ SUNG QUAN TRỌNG ĐỂ LỌC CHÍNH XÁC] ---
      // Lọc theo loại sản phẩm (deviceType)
      if (req.query.deviceType && req.query.deviceType !== 'all') {
  // Giải mã chuỗi tiếng Việt nhận từ URL
  const decodedDeviceType = decodeURIComponent(req.query.deviceType);
  filter.deviceType = decodedDeviceType;
}

      // Lọc theo từ khóa tìm kiếm (search) nếu có
      if (req.query.search) {
        filter.name = { $regex: req.query.search, $options: 'i' };
      }

      // Lọc theo cơ sở (local) nếu có
      if (req.query.local && req.query.local !== 'all') {
        filter.local = req.query.local;
      }
      // ---------------------------------------------

      totalProducts = await Product.countDocuments(filter);

      let sortCondition = { createdAt: -1 };
      
      if (isAdminRequest) {
        sortCondition = { status: 1, createdAt: -1 };
      }

      product = await Product.find(filter)
        .sort(sortCondition)
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
      { returnDocument: 'after', runValidators: true }
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

// 4. UPDATE STATUS (ADMIN DUYỆT / TỪ CHỐI BÀI ĐĂNG)
const updateProductStatus = async (req, res) => {
  try {
    const { productId, status } = req.body; 
    const newStatus = status === 'Đã duyệt' ? 'Còn hàng' : 'Bị từ chối';

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { status: newStatus },
      { returnDocument: 'after' }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Đã ${status} bài viết thành công!`, 
      data: updatedProduct 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE: Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
  try {
    const productId = req.body.productId || req.body._id || req.params.id;
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm cần xóa' });
    }

    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa' });
    }
    
    return res.status(200).json({ success: true, message: `Xóa sản phẩm thành công` });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Xóa sản phẩm thất bại! Lỗi: ${error.message}` });
  }
};

module.exports = {
  createProduct,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct
};