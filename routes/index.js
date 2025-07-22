const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/gyms', require('./gymRoutes'));
router.use('/members', require('./memberRoutes'));

module.exports = router;