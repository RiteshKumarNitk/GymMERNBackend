const Tenant = require('../models/Tenant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
const ROLES = require('../config/roles');

exports.createTenant = async (req, res) => {
  try {
    const {
      name,
      domain,
      contactEmail,
      contactPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
      subscriptionType,
      autoRenew,
      onboardingStatus,
      status,
      location,
      billingAddress,
      businessDetails,
      businessHours,
      branding,
      paymentGateway,
      subscriptionStartDate,
      subscriptionEndDate
    } = req.body;

    // Required fields validation
    if (!name || !domain || !contactEmail || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Tenant already exists with this domain'
      });
    }

    // Generate tenantId
    const tenantId = domain.replace(/\./g, '-');

    const tenant = new Tenant({
      tenantId,
      name,
      domain,
      contactEmail,
      contactPhone,
      ownerName,
      subscriptionType,
      autoRenew,
      onboardingStatus,
      status: status || 'active',
      location,
      billingAddress,
      businessDetails,
      businessHours,
      branding,
      paymentGateway,
      subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate || new Date(new Date(subscriptionStartDate).setMonth(new Date(subscriptionStartDate).getMonth() + 1)),
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

    logger.info(`Tenant created: ${tenant.name} (${tenant.tenantId}) by ${req.user?.email || 'system'}`);

    res.status(201).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    logger.error(`Tenant creation failed: ${err.message}`, err);
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
    const { id } = req.params;
    const updates = req.body;

    const allowedUpdates = ['status', 'plan', 'isActive'];
    const isValid = Object.keys(updates).every(key => allowedUpdates.includes(key));

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid update fields' });
    }

    const tenant = await Tenant.findOneAndUpdate({ tenantId: id }, updates, { new: true });

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.json({ success: true, data: tenant });
  } catch (err) {
    console.error('Error updating tenant:', err);
    res.status(500).json({ success: false, error: 'Server error' });
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
// PUT /api/tenants/:tenantId/profile
exports.updateTenantProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Fields owners are allowed to update
    const allowedFields = [
      'businessName',
      'businessId',
      'logo',
      'contactPhone',
      'billingAddress',
      'location',
      'website',
      'description',
    ];

    const isValid = Object.keys(updates).every(key => allowedFields.includes(key));

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid fields in profile update' });
    }

    const tenant = await Tenant.findOneAndUpdate({ tenantId: id }, updates, { new: true });

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.json({ success: true, data: tenant });
  } catch (err) {
    console.error('Error updating tenant profile:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// exports.updateTenant = async (req, res) => {
//   try {
//     const updates = req.body;
//     const tenantId = req.params.id;
    
//     // Validate allowed updates
//     const allowedUpdates = ['name', 'contactEmail', 'contactPhone', 'status', 'plan'];
//     const isValidUpdate = Object.keys(updates).every(update => 
//       allowedUpdates.includes(update)
//     );
    
//     if (!isValidUpdate) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid updates!'
//       });
//     }
    
//     const tenant = await Tenant.findOneAndUpdate(
//       { tenantId },
//       updates,
//       { new: true, runValidators: true }
//     );
    
//     if (!tenant) {
//       return res.status(404).json({
//         success: false,
//         error: 'Tenant not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: tenant
//     });
//   } catch (err) {
//     logger.error(`Update tenant failed: ${err.message}`);
//     res.status(500).json({
//       success: false,
//       error: 'Server error'
//     });
//   }
// };