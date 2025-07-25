const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validateUserInput } = require('../utils/validators');
const ROLES = require('../config/roles');

// @desc    Create a user (by owner or manager)
// @route   POST /api/users
exports.createUser = async (req, res) => {
  const { name, email, password, role, branch } = req.body;
  
  // Validation
  const { errors, isValid } = validateUserInput(req.body);
  
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Check permissions: owner can create any role except superadmin; manager can create trainer, frontdesk, member
  const allowedRoles = req.user.role === ROLES.OWNER 
    ? [ROLES.MANAGER, ROLES.TRAINER, ROLES.FRONTDESK, ROLES.MEMBER]
    : [ROLES.TRAINER, ROLES.FRONTDESK, ROLES.MEMBER];
  
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ msg: 'You are not allowed to create this role' });
  }

  try {
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      tenantId: req.user.tenantId,
      name,
      email,
      password,
      role,
      branch
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all users in the tenant
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};