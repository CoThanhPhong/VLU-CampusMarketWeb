const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/verifyToken');
const { getCurrentUser, getAllUsers, getUserById } = require('../controllers/userController');

router.post('/login', login);
router.get('/profile', verifyToken, getCurrentUser);
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.post('/user', verifyToken, getUserById);

module.exports = router;