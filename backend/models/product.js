const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
  local: { type: String, enum:["Cơ sở 1", "Cơ sở 2", "Cơ sở 3"], required: true },
  img: { type: [String], required: true },
  startDate: { type: Date, required: true },
  status: {type: String, enum: ["Còn hàng", "Hết hàng"], default: "Còn hàng"},
  deviceType: { type: String, enum: ["mobile", "tablet", "laptop", "mac"], required:true },
  endDate: { type: Date, required: false },
  author: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model('product', ProductSchema);