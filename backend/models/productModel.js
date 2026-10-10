const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  count: { type: Number, required: false },
  local: { type: String, required: true },
  img: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: false },
}, { timestamps: true });

module.exports = mongoose.model('productModel', ProductSchema);