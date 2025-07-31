// @desc    Create a new gym (tenant)
// @route   POST /api/gym
// @access  Super Admin only
exports.createGym = async (req, res) => {
  try {
    const { name, domain, contactEmail, contactPhone, address, ownerName, ownerEmail, ownerPassword } = req.body;
    
    // Validate required fields
    if (!name || !domain || !contactEmail || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, domain, contactEmail, ownerName, ownerEmail, ownerPassword'
      });
    }
    
    // Check if tenant with domain already exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'A gym with this domain already exists'
      });
    }
    
    // Generate a unique tenantId
    const tenantId = `tenant_${Date.now()}`;
    
    // Create new tenant
    const newTenant = new Tenant({
      tenantId,
      name,
      domain,
      contactEmail,
      contactPhone,
      status: 'active',
      subscriptionType: 'basic',
      location: address,
      businessDetails: {
        name,
        type: 'gym',
        registrationNumber: ''
      }
    });
    
    await newTenant.save();
    
    // Now create the owner user (this would typically be handled by userController)
    // For simplicity, we're just returning success here
    // In a real implementation, you would create the owner user with the provided credentials
    
    res.status(201).json({
      success: true,
      data: {
        tenant: newTenant,
        message: 'Gym created successfully. Owner account creation will be handled separately.'
      }
    });
  } catch (err) {
    logger.error(`Create gym failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

const Tenant = require('../models/Tenant');
const { logger } = require('../utils/logger');

// @desc    Update gym profile
// @route   PUT /api/gym/profile
// @access  Gym Owner
exports.updateGymProfile = async (req, res) => {
  try {
    const updates = req.body;
    const tenantId = req.user.tenantId;
    
    // Validate allowed updates
    const allowedUpdates = ['name', 'contactEmail', 'contactPhone', 'address', 'businessHours', 'facilities', 'socialMedia'];
    const isValidUpdate = Object.keys(updates).every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates!'
      });
    }
    
    const gym = await Tenant.findOneAndUpdate(
      { tenantId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!gym) {
      return res.status(404).json({
        success: false,
        error: 'Gym not found'
      });
    }
    
    res.json({
      success: true,
      data: gym
    });
  } catch (err) {
    logger.error(`Update gym failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get gym profile
// @route   GET /api/gym/profile
// @access  Gym Owner, Manager
exports.getGymProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const gym = await Tenant.findOne({ tenantId });
    
    if (!gym) {
      return res.status(404).json({
        success: false,
        error: 'Gym not found'
      });
    }
    
    res.json({
      success: true,
      data: gym
    });
  } catch (err) {
    logger.error(`Get gym profile failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};