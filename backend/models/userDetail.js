const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: false },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: { type: String, required: true },
    phone: { type: String, required: true },
    studentID: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('userDetail', UserSchema);