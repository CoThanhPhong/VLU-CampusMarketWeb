const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const UserSchema = new mongoose.Schema({
  mssv: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum:["admin", "user"], default: "user"},
  profile: { type: mongoose.Schema.ObjectId, ref: "userDetail"}
}, { timestamps: true });

// Middleware tự động hash password trước khi lưu vào database (Sửa lại chuẩn async/await)
UserSchema.pre('save', async function() {
  // Chỉ mã hóa nếu mật khẩu được tạo mới hoặc bị thay đổi
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; // Ném lỗi để Mongoose bắt được
  }
});

module.exports = mongoose.model('User', UserSchema);