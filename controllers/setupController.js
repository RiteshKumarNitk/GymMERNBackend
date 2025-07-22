const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');

exports.createSuperAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ role: ROLES.SUPERADMIN });
    if (existing) return res.status(400).json({ msg: 'SuperAdmin already exists' });

    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const superAdmin = await User.create({
      name,
      email,
      password: hashed,
      role: ROLES.SUPERADMIN,
      tenantId: 'root' // system-level tenant
    });

    res.status(201).json({ msg: 'SuperAdmin created', superAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
