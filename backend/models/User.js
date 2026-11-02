const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum:["admin", "user"], default: "user"},
  profile: { type: mongoose.Schema.ObjectId, ref: "userDetail"}
}, { timestamps: true });

module.exports = mongoose.model('user', UserSchema);