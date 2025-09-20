const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');
const { logger } = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ msg: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
      req.isMember = false;
      logger.info(`Authenticated: ${user.email} (User)`);
    } else {
      const member = await Member.findById(decoded.id).select('-password');
      if (!member) {
        logger.warn('Invalid token - user not found');
        return res.status(401).json({ msg: 'Invalid token' });
      }
      req.user = member;
      req.isMember = true; // ✅ important
      logger.info(`Authenticated: ${member.email} (Member)`);
    }

    next();
  } catch (err) {
    logger.error(`Authentication error: ${err.message}`);
    res.status(401).json({ msg: 'Please authenticate' });
  }
};

module.exports = auth;
