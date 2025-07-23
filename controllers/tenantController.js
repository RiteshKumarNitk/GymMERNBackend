const Tenant = require('../models/Tenant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');
const { logger } = require('../utils/logger');

exports.createTenant = async (req, res) => {
  const { name, domain, contactEmail, ownerName, ownerEmail, ownerPassword } = req.body;

  try {
    // Create tenant
    const tenant = new Tenant({
      name,
      domain,
      contactEmail,
      tenantId: domain.replace(/\./g, '-')
    });
    
    await tenant.save();

    // Create owner user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);

    const owner = new User({
      tenantId: tenant.tenantId,
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: ROLES.OWNER
    });

    await owner.save();

    // Moved the logger AFTER tenant is created
    logger.info(`Tenant created: ${tenant.name} (${tenant.tenantId}) by ${ownerEmail}`);
    
    res.status(201).json(tenant);
  } catch (err) {
    logger.error(`Tenant creation failed: ${err.message}`);
    res.status(500).json({ 
      msg: 'Server error',
      error: err.message 
    });
  }
};

exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    logger.info(`Fetched ${tenants.length} tenants`);
    res.json(tenants);
  } catch (err) {
    logger.error(`Failed to fetch tenants: ${err.message}`);
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
};