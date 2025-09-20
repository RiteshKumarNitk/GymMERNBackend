const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { validateLoginInput } = require('../utils/validators');
const { logger } = require('../utils/logger');

// MODELS
const User = require('../models/User');
const Member = require('../models/Member');

exports.login = async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    logger.warn(`Login validation failed: ${JSON.stringify(errors)}`);
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;
  try {
    // 🔍 First check User model
    let account = await User.findOne({ email }).select('+password');
    let accountType = 'USER';

    // 🔍 If not found, check Member model
    if (!account) {
      account = await Member.findOne({ email }).select('+password');
      accountType = 'MEMBER';
    }

    // ❌ Not found
    if (!account) {
      logger.warn(`Login failed - Account not found: ${email}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // 🔑 Validate password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      logger.warn(`Login failed - Incorrect password for ${email}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // 🎟 Generate token
    const token = generateToken({
      id: account._id,
      email: account.email,
      role: account.role || accountType, // fallback if role not in Member
      tenantId: account.tenantId,
    });

    logger.info(`Login success: ${email} (${accountType})`);

    res.json({
      token,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
        role: account.role || accountType,
        tenantId: account.tenantId,
      },
    });
  } catch (err) {
    logger.error(`Login error for ${email}: ${err.message}`);
    res.status(500).send('Server error');
  }
};

// GET current logged-in account
exports.getMe = async (req, res) => {
  try {
    // Try both User & Member
    let user = await User.findById(req.user.id).select('-password');
    if (!user) {
      user = await Member.findById(req.user.id).select('-password');
    }

    if (!user) return res.status(404).json({ msg: 'Account not found' });

    res.json(user);
  } catch (err) {
    logger.error(`GetMe error: ${err.message}`);
    res.status(500).send('Server Error');
  }
};
