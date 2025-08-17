const Tenant = require('../models/Tenant');
const User = require('../models/User');

const checkTenantStatus = async (req, res, next) => {
  try {
    // Find tenant
    const tenant = await Tenant.findOne({ tenantId: req.body.tenantId });
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    // Check tenant status
    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Tenant is inactive. Please contact support.'
      });
    }

    // Find user (assuming email is coming from req.user or req.body)
    const userId = req.user?._id || req.body.userId; // Adjust according to your auth system
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'User is inactive, please contact admin.'
      });
    }

    // Proceed
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = checkTenantStatus;
