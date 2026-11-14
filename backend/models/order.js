const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.ObjectId, 
    ref: "user", 
    required: true 
  },
  orderItems: [
    {
      product: { 
        type: mongoose.Schema.ObjectId, 
        ref: "product", 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true, 
        min: 1 
      },
      price: { 
        type: Number, 
        required: true 
      }, // Lưu lại giá tại thời điểm đặt hàng tránh trường hợp product thay đổi giá sau đó
      local: { 
        type: String, 
        enum: ["Cơ sở 1", "Cơ sở 2", "Cơ sở 3"], 
        required: true 
      },
      status: {
        type: String,
        enum: ["Chờ xác nhận", "Đã xác nhận", "Đã hủy", "Đã từ chối"],
        default: "Chờ xác nhận"
      }
    }
  ],
  shippingInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    local: { 
      type: String, 
      enum: ["Cơ sở 1", "Cơ sở 2", "Cơ sở 3"], 
      required: true 
    } // Cơ sở nhận hàng hoặc giao tới
  },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ["COD", "Banking", "MoMo"], 
    default: "COD" 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  orderStatus: {
    type: String,
    enum: ["Chờ xác nhận", "Đã xác nhận", "Đã hủy", "Đã từ chối"],
    default: "Chờ xác nhận"
  },
  isPaid: { 
    type: Boolean, 
    default: false 
  },
  paidAt: { 
    type: Date 
  },
}, { timestamps: true });

module.exports = mongoose.model('order', OrderSchema);