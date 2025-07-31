const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { logger } = require('../utils/logger');
const ROLES = require('../config/roles');

// @desc    Get CRM reports
// @route   GET /api/superadmin/reports
// @access  Super Admin
exports.getCRMReports = async (req, res) => {
  try {
    // Get all tenants
    const tenants = await Tenant.find();
    
    // Get total users across all tenants
    const totalUsers = await User.countDocuments();
    
    // Get total members
    const totalMembers = await Member.countDocuments();
    
    // Get recent payments
    const recentPayments = await Payment.find()
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate('memberId', 'name');
    
    res.json({
      success: true,
      data: {
        tenantCount: tenants.length,
        totalUsers,
        totalMembers,
        recentPayments
      }
    });
  } catch (err) {
    logger.error(`CRM report failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get all tenants
// @route   GET /api/superadmin/tenants
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

// @desc    Get tenant details
// @route   GET /api/superadmin/tenants/:id
// @access  Super Admin
exports.getTenantDetails = async (req, res) => {
  try {
    // First try to find by MongoDB _id
    let tenant = await Tenant.findById(req.params.id);
    
    // If not found, try by tenantId field
    if (!tenant) {
      tenant = await Tenant.findOne({ tenantId: req.params.id });
    }
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Get tenant users
    const users = await User.find({ tenantId: tenant.tenantId })
      .select('-password');
    
    // Get tenant members
    const members = await Member.find({ tenantId: tenant.tenantId })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        tenant,
        users,
        members
      }
    });
  } catch (err) {
    logger.error(`Get tenant details failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};