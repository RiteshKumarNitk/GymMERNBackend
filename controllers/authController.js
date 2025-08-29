const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validateLoginInput } = require('../utils/validators');
const { logger } = require('../utils/logger');

exports.login = async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  console.log("Request Body:", req.body); // Debug request input

  if (!isValid) {
    console.log("Validation Errors:", errors); // Debug validation failure
    logger.warn(`Login validation failed: ${JSON.stringify(errors)}`);
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;
  console.log("Attempting login for:", email); // Debug email input

  try {
    const user = await User.findOne({ email }).select('+password');
    console.log("User Found:", !!user); // Show whether user was found

    if (!user) {
      logger.warn(`Login failed - User not found: ${email}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isMatch); // Show if password matched

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

    console.log("Generated Token:", token); // Debug token output

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
    console.error("Login Error:", err); // Full error in console
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
