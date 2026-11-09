const Cart = require('../models/Cart');
const Product = require('../models/product');

// 1. Lấy giỏ hàng của user từ Database
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm giỏ hàng của user và populate thông tin chi tiết của Product (tên, giá, ảnh,...)
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price img amount status local deviceType'
    });

    // Nếu user chưa có giỏ hàng nào trong DB, trả về mảng items trống
    if (!cart) {
      return res.status(200).json({ 
        success: true, 
        data: [] 
      });
    }

    // Map lại dữ liệu để cấu trúc trả về khớp với frontend đang sử dụng (giống như mảng cartItems trước đó)
    const formattedItems = cart.items.map(item => ({
      _id: item._id,
      product: item.product?._id,
      name: item.product?.name,
      price: item.product?.price,
      img: item.product?.img,
      amount: item.product?.amount, // Tồn kho hiện tại để check giới hạn
      local: item.product?.local,
      quantity: item.quantity
    }));

    return res.status(200).json({ 
      success: true, 
      data: formattedItems 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Cập nhật / Đồng bộ giỏ hàng lên Database
exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Mảng sản phẩm từ Frontend gửi lên

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu giỏ hàng không hợp lệ' });
    }

    // Chuyển đổi format từ Frontend sang format schema `items` của MongoDB
    // Schema yêu cầu: product (ObjectId), quantity (Number)
    const formattedItems = items.map(item => ({
      product: item.product,
      quantity: item.quantity
    }));

    // Tìm giỏ hàng của user, nếu chưa có thì tạo mới (upsert: true)
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: formattedItems
      });
    } else {
      cart.items = formattedItems;
    }

    await cart.save();

    // Populate lại để trả về data đầy đủ thông tin cho frontend hiển thị ngay nếu cần
    await cart.populate({
      path: 'items.product',
      select: 'name price img amount status local deviceType'
    });

    const responseItems = cart.items.map(item => ({
      _id: item._id,
      product: item.product?._id,
      name: item.product?.name,
      price: item.product?.price,
      img: item.product?.img,
      amount: item.product?.amount,
      local: item.product?.local,
      quantity: item.quantity
    }));

    return res.status(200).json({ 
      success: true, 
      message: 'Đồng bộ giỏ hàng vào Database thành công',
      data: responseItems
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};