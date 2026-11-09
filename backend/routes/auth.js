const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/verifyToken');
const { getCurrentUser, getAllUsers, getUserById, updateCurrentUser } = require('../controllers/userController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', verifyToken, getCurrentUser);
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.post('/user', verifyToken, getUserById);
router.post('/user/u', verifyToken, updateCurrentUser);

module.exports = router;