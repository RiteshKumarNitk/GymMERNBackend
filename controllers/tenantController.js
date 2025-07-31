const Tenant = require('../models/Tenant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
const ROLES = require('../config/roles');

// @desc    Create new tenant (gym)
// @route   POST /api/tenants
// @access  Super Admin
exports.createTenant = async (req, res) => {
  const { name, domain, contactEmail, ownerName, ownerEmail, ownerPassword } = req.body;

  try {
    // Validate input
    if (!name || !domain || !contactEmail || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    // Create tenant
    const tenant = new Tenant({
      name,
      domain,
      contactEmail,
      tenantId: domain.replace(/\./g, '-'),
      status: 'active'
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

    logger.info(`Tenant created: ${tenant.name} (${tenant.tenantId}) by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    logger.error(`Tenant creation failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get all tenants (superadmin only)
// @route   GET /api/tenants
// @access  Super Admin
exports.getTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const tenants = await Tenant.paginate({}, options);

    res.json({
      success: true,
      data: tenants
    });
  } catch (err) {
    logger.error(`Get tenants failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Super Admin
exports.updateTenant = async (req, res) => {
  try {
    const updates = req.body;
    const tenantId = req.params.id;
    
    // Validate allowed updates
    const allowedUpdates = ['name', 'contactEmail', 'contactPhone', 'status', 'plan'];
    const isValidUpdate = Object.keys(updates).every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates!'
      });
    }
    
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    res.json({
      success: true,
      data: tenant
    });
  } catch (err) {
    logger.error(`Update tenant failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete tenant (archive)
// @route   DELETE /api/tenants/:id
// @access  Super Admin
exports.deleteTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;
    
    // Verify tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Archive instead of actual delete
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { status: 'archived' },
      { new: true }
    );
    
    // Optional: Schedule actual data deletion after 30 days
    // scheduleDeletion(tenantId); 
    
    logger.info(`Tenant archived: ${tenantId} by ${req.user.email}`);
    
    res.json({
      success: true,
      data: updatedTenant
    });
    
  } catch (err) {
    logger.error(`Delete tenant failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Deactivate tenant
// @route   PUT /api/tenants/:id/deactivate
// @access  Super Admin, Owner
exports.deactivateTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;
    
    // Verify tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Check if user has permission (must be superadmin or the tenant owner)
    if (req.user.role !== 'SUPERADMIN' && 
        (req.user.tenantId !== tenantId || req.user.role !== 'OWNER')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to deactivate this tenant'
      });
    }
    
    // Deactivate tenant
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { status: 'inactive' },
      { new: true }
    );
    
    logger.info(`Tenant deactivated: ${tenantId} by ${req.user.email}`);
    
    res.json({
      success: true,
      data: updatedTenant
    });
    
  } catch (err) {
    logger.error(`Deactivate tenant failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Reactivate tenant
// @route   PUT /api/tenants/:id/reactivate
// @access  Super Admin
exports.reactivateTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;
    
    // Verify tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Only superadmins can reactivate tenants
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reactivate tenants'
      });
    }
    
    // Reactivate tenant
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { status: 'active' },
      { new: true }
    );
    
    logger.info(`Tenant reactivated: ${tenantId} by ${req.user.email}`);
    
    res.json({
      success: true,
      data: updatedTenant
    });
    
  } catch (err) {
    logger.error(`Reactivate tenant failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update tenant business details
// @route   PUT /api/tenants/:id/business-details
// @access  Super Admin, Owner
exports.updateBusinessDetails = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { businessDetails, location, contactPhone, billingAddress } = req.body;
    
    // Verify tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Check if user has permission (must be superadmin or the tenant owner)
    if (req.user.role !== 'SUPERADMIN' && 
        (req.user.tenantId !== tenantId || req.user.role !== 'OWNER')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this tenant'
      });
    }
    
    // Update business details
    const updates = {};
    
    if (businessDetails) updates.businessDetails = businessDetails;
    if (location) updates.location = location;
    if (contactPhone) updates.contactPhone = contactPhone;
    if (billingAddress) updates.billingAddress = billingAddress;
    
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId },
      updates,
      { new: true, runValidators: true }
    );
    
    logger.info(`Tenant business details updated: ${tenantId} by ${req.user.email}`);
    
    res.json({
      success: true,
      data: updatedTenant
    });
    
  } catch (err) {
    logger.error(`Update tenant business details failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get tenant details
// @route   GET /api/tenants/:id
// @access  Super Admin, Owner, Admin of the tenant
exports.getTenantDetails = async (req, res) => {
  try {
    const tenantId = req.params.id;
    
    // Verify tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this tenant'
      });
    }
    
    res.json({
      success: true,
      data: tenant
    });
    
  } catch (err) {
    logger.error(`Get tenant details failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// const Tenant = require('../models/Tenant');
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const ROLES = require('../config/roles');
// const { logger } = require('../utils/logger');

// exports.createTenant = async (req, res) => {
//   const { name, domain, contactEmail, ownerName, ownerEmail, ownerPassword } = req.body;

//   try {
//     // Create tenant
//     const tenant = new Tenant({
//       name,
//       domain,
//       contactEmail,
//       tenantId: domain.replace(/\./g, '-')
//     });
    
//     await tenant.save();

//     // Create owner user
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(ownerPassword, salt);

//     const owner = new User({
//       tenantId: tenant.tenantId,
//       name: ownerName,
//       email: ownerEmail,
//       password: hashedPassword,
//       role: ROLES.OWNER
//     });

//     await owner.save();

//     // Moved the logger AFTER tenant is created
//     logger.info(`Tenant created: ${tenant.name} (${tenant.tenantId}) by ${ownerEmail}`);
    
//     res.status(201).json(tenant);
//   } catch (err) {
//     logger.error(`Tenant creation failed: ${err.message}`);
//     res.status(500).json({ 
//       msg: 'Server error',
//       error: err.message 
//     });
//   }
// };

// exports.getTenants = async (req, res) => {
//   try {
//     const tenants = await Tenant.find();
//     logger.info(`Fetched ${tenants.length} tenants`);
//     res.json(tenants);
//   } catch (err) {
//     logger.error(`Failed to fetch tenants: ${err.message}`);
//     res.status(500).json({
//       msg: 'Server error',
//       error: err.message
//     });
//   }
// };