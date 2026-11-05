const Order = require('../models/order.model');
const Product = require('../models/product.model');

// 1. Tạo đơn hàng mới (Dùng cho trang Checkout)
exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingInfo, paymentMethod, totalPrice } = req.body;
    const userId = req.user._id; // Lấy từ middleware xác thực (Auth)

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

    // Tạo bản ghi đơn hàng
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
    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy danh sách đơn hàng của user (Dùng cho trang OrderListPage)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId })
      .populate('orderItems.product', 'name img deviceType')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body; // Lấy orderId từ Request Body

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng (orderId) trong request body!' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.orderStatus !== 'Chờ xác nhận') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận' });
    }

    order.orderStatus = 'Đã hủy';
    await order.save();

    // Hoàn lại số lượng vào kho sản phẩm
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.amount += item.quantity;
        if (product.amount > 0) {
          product.status = "Còn hàng";
        }
        await product.save();
      }
    }

    res.status(200).json({ success: true, message: 'Đã hủy đơn hàng thành công', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};