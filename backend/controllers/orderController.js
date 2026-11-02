
const Order = require('../models/order'); // Đổi thành chữ hoa Order để chuẩn Mongoose Model
const Product = require('../models/product');
const Cart = require('../models/Cart');

// 1. Tạo đơn hàng mới (Dùng cho trang Checkout)
exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingInfo, paymentMethod, totalPrice } = req.body;
    const userId = req.user.id; // Lấy từ middleware xác thực (Auth)

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống!' });
    }

    // Kiểm tra tồn kho và cập nhật số lượng sản phẩm (amount)
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Sản phẩm ${item.product} không tồn tại` });
      }
      if (product.amount < item.quantity) {
        return res.status(400).json({ success: false, message: `Sản phẩm ${product.name} không đủ số lượng trong kho.` });
      }
      
      // Trừ số lượng tồn kho
      product.amount -= item.quantity;
      if (product.amount === 0) {
        product.status = "Hết hàng";
      }
      await product.save();
    }

    // Tạo bản ghi đơn hàng (Sử dụng Model Order chữ hoa)
    const newOrder = new Order({
      user: userId,
      orderItems,
      shippingInfo,
      paymentMethod,
      totalPrice,
      isPaid: paymentMethod !== 'COD',
      paidAt: paymentMethod !== 'COD' ? Date.now() : null
    });

    const savedOrder = await newOrder.save();
    await Cart.findOneAndDelete({ user: userId });

    // Xóa cache myOrders trong session nếu có, để lần sau gọi sẽ load lại đơn hàng mới nhất từ DB
    if (req.session && req.session.myOrders) {
      delete req.session.myOrders;
      delete req.session.cartItems; // Xóa luôn cache cartItems trong session
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy danh sách đơn hàng của user (Dùng cho trang OrderListPage)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id; 

    // 1. Kiểm tra xem danh sách đơn hàng đã được lưu trong session chưa
    if (req.session && req.session.myOrders) {
      return res.status(200).json({ 
        success: true, 
        data: req.session.myOrders 
      });
    }

    // 2. Nếu chưa có trong session, tiến hành query từ Database
    const orders = await Order.find({ user: userId })
      .populate('orderItems.product', 'name img deviceType')
      .sort({ createdAt: -1 });

    // 3. Lưu kết quả vào Session để dùng cho các lần gọi sau
    if (req.session) {
      req.session.myOrders = orders;
    }

    return res.status(200).json({ 
      success: true, 
      data: orders 
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body; // Lấy orderId từ Request Body

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng (orderId) trong request body!' });
    }

    // Đổi tên biến thành foundOrder để tránh bị trùng tên với biến Model "Order" ở trên đầu file
    const foundOrder = await Order.findById(orderId);

    if (!foundOrder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (foundOrder.orderStatus !== 'Chờ xác nhận') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận' });
    }

    foundOrder.orderStatus = 'Đã hủy';
    await foundOrder.save();

    // Hoàn lại số lượng vào kho sản phẩm
    for (const item of foundOrder.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.amount += item.quantity;
        if (product.amount > 0) {
          product.status = "Còn hàng";
        }
        await product.save();
      }
    }

    // Xóa cache session myOrders để khi load lại trang nó query dữ liệu mới nhất (đã cập nhật trạng thái Đã hủy)
    if (req.session && req.session.myOrders) {
      delete req.session.myOrders;
    }

    res.status(200).json({ success: true, message: 'Đã hủy đơn hàng thành công', data: foundOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};