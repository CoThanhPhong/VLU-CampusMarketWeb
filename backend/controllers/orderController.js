const Order = require('../models/order'); // Đổi thành chữ hoa Order để chuẩn Mongoose Model
const Product = require('../models/product');
const Cart = require('../models/cart');

const getItemSellerId = (item) => {
  const author = item.product?.author || item.product?.seller || item.author || item.seller;
  if (!author) return null;
  if (typeof author === 'string') return author;
  if (author._id) return author._id.toString();
  if (typeof author.id === 'string') return author.id;
  return author.toString();
};

const updateOrderStatus = (order) => {
  const allItemsRejected = order.orderItems.every(item => item.status === 'Đã từ chối');
  const allItemsConfirmed = order.orderItems.every(item => item.status === 'Đã xác nhận');
  const allItemsProcessed = order.orderItems.every(item => (
    item.status === 'Đã từ chối' || item.status === 'Đã xác nhận'
  ));

  if (allItemsRejected) {
    order.orderStatus = 'Đã từ chối';
    order.isPaid = false;
  } else if (allItemsProcessed) {
    order.orderStatus = 'Đã xác nhận';
    order.isPaid = allItemsConfirmed;
    order.paidAt = allItemsConfirmed ? Date.now() : null;
  } else {
    order.orderStatus = 'Chờ xác nhận';
    order.isPaid = false;
    order.paidAt = null;
  }
};

const restoreRejectedItemStock = async (item) => {
  const productId = item.product?._id || item.product;
  const product = await Product.findById(productId);
  if (!product) return;

  product.amount += item.quantity;
  if (product.amount > 0) product.status = 'Còn hàng';
  await product.save();
};

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

    // BỎ đoạn check session myOrders đi để luôn query dữ liệu mới nhất từ Database chuẩn xác 100%
    const orders = await Order.find({ user: userId })
      .populate('orderItems.product', 'name img deviceType')
      .sort({ createdAt: -1 });

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
    foundOrder.isPaid = false;
    foundOrder.paidAt = null;

    // Hoàn lại số lượng vào kho sản phẩm
    for (const item of foundOrder.orderItems) {
      const wasRejected = item.status === 'Đã từ chối';
      item.status = 'Đã hủy';
      if (wasRejected) continue;

      const product = await Product.findById(item.product);
      if (product) {
        product.amount += item.quantity;
        if (product.amount > 0) {
          product.status = "Còn hàng";
        }
        await product.save();
      }
    }
    await foundOrder.save();

    // Xóa cache session myOrders để khi load lại trang nó query dữ liệu mới nhất (đã cập nhật trạng thái Đã hủy)
    if (req.session && req.session.myOrders) {
      delete req.session.myOrders;
    }

    res.status(200).json({ success: true, message: 'Đã hủy đơn hàng thành công', data: foundOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng (orderId)' });
    }

    const foundOrder = await Order.findById(orderId);

    if (!foundOrder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Cập nhật trạng thái thanh toán và đơn hàng
    foundOrder.isPaid = true;
    foundOrder.paidAt = Date.now();
    foundOrder.orderStatus = 'Đã xác nhận'; // Hoặc 'Đã xác nhận' tùy luồng của bạn

    const updatedOrder = await foundOrder.save();

    // Xóa cache session nếu có để dữ liệu đồng bộ
    if (req.session && req.session.myOrders) {
      delete req.session.myOrders;
    }

    return res.status(200).json({
      success: true,
      message: 'Xác nhận thanh toán thành công!',
      data: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// 5. Lấy danh sách đơn hàng dành cho Người bán (Dựa vào sản phẩm có author trùng với user hiện tại)
exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id; // Lấy ID của người bán đang đăng nhập từ middleware xác thực

    // 1. Tìm tất cả đơn hàng và populate thông tin sản phẩm (bao gồm trường author của sản phẩm)
    const allOrders = await Order.find()
      .populate({
        path: 'orderItems.product',
        select: 'name img price author',
      })
      .sort({ createdAt: -1 });

    // 2. Lọc chỉ lấy các đơn hàng có chứa ít nhất một sản phẩm do người bán này đăng (author === sellerId)
    const sellerOrders = allOrders.filter(order => {
      return order.orderItems.some(item => {
        const productAuthor = item.product?.author?._id || item.product?.author;
        return productAuthor && productAuthor.toString() === sellerId.toString();
      });
    });

    return res.status(200).json({
      success: true,
      data: sellerOrders
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng người bán:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// 6. Xác nhận thanh toán từng sản phẩm cho Người bán
exports.confirmOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.body;
    const sellerId = req.user._id || req.user.id;

    const order = await Order.findById(orderId).populate({
      path: 'orderItems.product',
      select: 'name img price author seller'
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    let foundItem = false;

    order.orderItems.forEach(item => {
      const currentItemId = item._id.toString();
      const productId = item.product?._id ? item.product._id.toString() : item.product?.toString();

      if (currentItemId === itemId || productId === itemId) {
        const authorField = item.product?.author || item.product?.seller || item.author;
        const authorId = typeof authorField === 'object' ? authorField?._id?.toString() : authorField?.toString();

        if (authorId && authorId !== sellerId.toString()) {
          throw new Error('UNAUTHORIZED');
        }
        if (item.status !== 'Chờ xác nhận') {
          throw new Error('INVALID_STATUS');
        }

        foundItem = true;
        item.isPaid = true;
        item.status = 'Đã xác nhận';
      }
    });

    if (!foundItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong đơn hàng' });
    }

    updateOrderStatus(order);

    await order.save();

    // ==========================================
    // KHẮC PHỤC LỖI CACHE SESSION:
    // Xóa session myOrders của người mua (order.user) nếu server có lưu cache theo session map.
    // Hoặc đơn giản là reset toàn bộ session.myOrders hiện hành để bắt buộc query từ DB.
    // ==========================================
    if (req.session) {
      delete req.session.myOrders;
    }

    return res.status(200).json({
      success: true,
      message: 'Xác nhận sản phẩm thành công!',
      data: order
    });

  } catch (err) {
    if (err.message === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xác nhận sản phẩm này' });
    }
    if (err.message === 'INVALID_STATUS') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể xác nhận sản phẩm đang chờ xử lý' });
    }
    console.error('Lỗi confirm-item:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

exports.rejectOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.body;
    const sellerId = (req.user._id || req.user.id).toString();

    if (!orderId || !itemId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng hoặc sản phẩm' });
    }

    const order = await Order.findById(orderId).populate({
      path: 'orderItems.product',
      select: 'author seller'
    });

    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    if (order.orderStatus === 'Đã hủy' || order.orderStatus === 'Đã từ chối') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không còn ở trạng thái chờ xử lý' });
    }

    const item = order.orderItems.find(orderItem => {
      const productId = orderItem.product?._id?.toString() || orderItem.product?.toString();
      return orderItem._id.toString() === itemId || productId === itemId;
    });

    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong đơn hàng' });
    if (getItemSellerId(item) !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối sản phẩm này' });
    }
    if (item.status !== 'Chờ xác nhận') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể từ chối sản phẩm đang chờ xác nhận' });
    }

    item.status = 'Đã từ chối';
    await restoreRejectedItemStock(item);
    updateOrderStatus(order);
    await order.save();

    if (req.session) delete req.session.myOrders;
    return res.status(200).json({ success: true, message: 'Đã từ chối sản phẩm', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectSellerOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const sellerId = (req.user._id || req.user.id).toString();

    if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng' });

    const order = await Order.findById(orderId).populate({
      path: 'orderItems.product',
      select: 'author seller'
    });

    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    if (order.orderStatus === 'Đã hủy' || order.orderStatus === 'Đã từ chối') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không còn ở trạng thái chờ xử lý' });
    }

    const sellerItems = order.orderItems.filter(item => getItemSellerId(item) === sellerId);
    if (sellerItems.length === 0) {
      return res.status(403).json({ success: false, message: 'Đơn hàng không có sản phẩm của bạn' });
    }
    if (sellerItems.some(item => !['Chờ xác nhận', 'Đã từ chối'].includes(item.status))) {
      return res.status(400).json({ success: false, message: 'Không thể từ chối đơn có sản phẩm đã xác nhận hoặc đã hủy' });
    }

    for (const item of sellerItems) {
      if (item.status === 'Đã từ chối') continue;
      item.status = 'Đã từ chối';
      await restoreRejectedItemStock(item);
    }

    updateOrderStatus(order);
    await order.save();
    if (req.session) delete req.session.myOrders;

    return res.status(200).json({ success: true, message: 'Đã từ chối các sản phẩm của bạn trong đơn hàng', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};