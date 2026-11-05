const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: false },
    avatar: { type: String, required: false },
    phone: { type: String, required: true },
    products: [{ type: mongoose.Schema.ObjectId, ref: "product" }],
}, { timestamps: true });

module.exports = mongoose.model('userDetail', UserSchema);