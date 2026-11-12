const Product = require('../models/product');
const User = require('../models/User');
const UserDetail = require('../models/userDetail');

// 1. CREATE: Tạo mới hoặc lưu sản phẩm & tự động đồng bộ vào UserDetail.products[]
const createProduct = async (req, res) => {
  try {
    const data = req.body;
    
    if (Array.isArray(data)) {
      // Trường hợp tạo mảng nhiều sản phẩm
      const formattedData = data.map(item => ({
        ...item,
        status: item.status || 'Chờ duyệt',
        startDate: item.startDate || new Date().toISOString()
      }));
      const newProducts = await Product.insertMany(formattedData);

      // Tự động đẩy danh sách ID vào UserDetail tương ứng của từng author
      for (const prod of newProducts) {
        if (prod.author) {
          const authorUser = await User.findById(prod.author);
          if (authorUser && authorUser.profile) {
            await UserDetail.findByIdAndUpdate(
              authorUser.profile,
              { $addToSet: { products: prod._id } }
            );
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: `Tạo ${newProducts.length} sản phẩm thành công`,
        data: newProducts
      });
    } else {
      let savedProduct;
      const authorId = data.author;

      if (data._id) {
        // Cập nhật sản phẩm cũ
        savedProduct = await Product.findByIdAndUpdate(data._id, data, { returnDocument: 'after', runValidators: true, upsert: true });
      } else {
        // Đăng sản phẩm mới
        const productData = {
          ...data,
          status: data.status || 'Chờ duyệt',
          startDate: new Date().toISOString()
        };
        const newProduct = new Product(productData);
        savedProduct = await newProduct.save();

        // --- TỰ ĐỘNG THÊM PRODUCT ID VÀO MẢNG PRODUCTS CỦA USER DETAIL ---
        if (authorId) {
          const authorUser = await User.findById(authorId);
          if (authorUser && authorUser.profile) {
            await UserDetail.findByIdAndUpdate(
              authorUser.profile,
              { $addToSet: { products: savedProduct._id } }, // $addToSet giúp tránh bị trùng lặp ID
              { new: true }
            );
          }
        }
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
      const isGetAll = req.query.getAll === 'true'; // <--- Thêm cờ nhận diện lấy tất cả

      if (!isAdminRequest) {
        filter.amount = { $gt: 0 };
        filter.status = { $in: ['Còn hàng', 'Đã duyệt'] };
      }

      if (req.query.deviceType && req.query.deviceType !== 'all') {
        const decodedDeviceType = decodeURIComponent(req.query.deviceType);
        filter.deviceType = decodedDeviceType;
      }

      if (req.query.search) {
        filter.name = { $regex: req.query.search, $options: 'i' };
      }

      if (req.query.local && req.query.local !== 'all') {
        filter.local = req.query.local;
      }

      totalProducts = await Product.countDocuments(filter);

      let sortCondition = { createdAt: -1 };
      if (isAdminRequest) {
        sortCondition = { status: 1, createdAt: -1 };
      }

      // Xây dựng câu lệnh query cơ bản
      let query = Product.find(filter).sort(sortCondition).populate({
        path: 'author',
        select: '-password',
        populate: { path: 'profile' }
      });

      // --- NẾU KHÔNG PHẢI LÀ LẤY TẤT CẢ THÌ MỚI ÁP DỤNG PHÂN TRANG ---
      if (!isGetAll) {
        query = query.skip(skip).limit(limit);
      }

      product = await query.exec();

      return res.status(200).json({ 
        success: true, 
        currentPage: page,
        totalPages: isGetAll ? 1 : (Math.ceil(totalProducts / limit) || 1),
        totalProducts: totalProducts,
        count: product.length, 
        data: product 
      });

    } else {
      product = await Product.findById(req.body._id).populate({
        path: 'author',
        select: '-password',
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

// 5. DELETE: Xóa sản phẩm theo ID & tự động gỡ bỏ ID khỏi UserDetail.products[]
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
    
    // --- TỰ ĐỘNG GỠ BỎ PRODUCT ID KHỎI MẢNG PRODUCTS CỦA USER DETAIL ---
    if (deletedProduct.author) {
      const authorUser = await User.findById(deletedProduct.author);
      if (authorUser && authorUser.profile) {
        await UserDetail.findByIdAndUpdate(
          authorUser.profile,
          { $pull: { products: deletedProduct._id } } // Dùng $pull để xóa ID ra khỏi mảng
        );
      }
    }

    return res.status(200).json({ success: true, message: `Xóa sản phẩm thành công` });
  } catch (error) {
    return res.status(500).json({ success: `Xóa sản phẩm thất bại! Lỗi: ${error.message}` });
  }
};

module.exports = {
  createProduct,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct
};