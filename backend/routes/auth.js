const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/verifyToken');
const { getCurrentUser, getAllUsers, getUserById, updateCurrentUser, deleteUser, updateUserRole } = require('../controllers/userController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', verifyToken, getCurrentUser);
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.post('/user', verifyToken, getUserById);
router.post('/user/u', verifyToken, updateCurrentUser);
router.put('/user/update-role', verifyToken, isAdmin, updateUserRole);
router.delete('/user/d', verifyToken, isAdmin, deleteUser);

module.exports = router;