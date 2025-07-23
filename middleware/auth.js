// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ msg: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn('Invalid token - user not found');
      return res.status(401).json({ msg: 'Invalid token' });
    }

    req.user = user; // This attaches the user to the request
    logger.info(`Authenticated user: ${user.email} (${user.role})`);
    next();
  } catch (err) {
    logger.error(`Authentication error: ${err.message}`);
    res.status(401).json({ msg: 'Please authenticate' });
  }
};

module.exports = auth;