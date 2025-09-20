const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Login (User or Member)
router.post('/login', authController.login);

// Get current logged-in account
router.get('/me', auth, authController.getMe);

module.exports = router;
