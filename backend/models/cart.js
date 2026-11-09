const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    // Liên kết với tài khoản User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // Mỗi user chỉ có 1 giỏ hàng duy nhất
    },
    // Danh sách sản phẩm trong giỏ hàng
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product', // Liên kết tới bảng Product của bạn
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Số lượng sản phẩm ít nhất phải là 1'],
          default: 1
        }
      }
    ]
  },
  {
    timestamps: true // Tự động tạo createdAt và updatedAt
  }
);

module.exports = mongoose.model('Cart', cartSchema);