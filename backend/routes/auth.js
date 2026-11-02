const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');
const { getUserProfile } = require('../controllers/userController');

router.post('/login', login);
router.get('/profile', verifyToken, getUserProfile);

module.exports = router;