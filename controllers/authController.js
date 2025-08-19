const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validateLoginInput } = require('../utils/validators');
const { logger } = require('../utils/logger');
const Tenant = require("../models/Tenant");

exports.login = async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    logger.warn(`Login validation failed: ${JSON.stringify(errors)}`);
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logger.warn(`Login failed - User not found: ${email}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    if (user.role !== 'superadmin') {
  const tenant = await Tenant.findOne({ tenantId: user.tenantId });
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }

    // Check tenant status
    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your gym account has been deactivated. Please contact support.',
      });
    }
  }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed - Incorrect password for user: ${email}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    logger.info(`User logged in: ${email} (Role: ${user.role})`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    logger.error(`Login error for ${email}: ${err.message}`);
    res.status(500).send('Server error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    logger.error(`GetMe error: ${err.message}`);
    res.status(500).send('Server Error');
  }
};
