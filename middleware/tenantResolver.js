const Tenant = require('../models/Tenant');

const tenantResolver = async (req, res, next) => {
  try {
    // Extract tenant ID from header (could be from subdomain in production)
    const tenantId = req.headers['x-tenant-id'];
    
    if (!tenantId) {
      return res.status(400).json({ msg: 'Tenant identification missing' });
    }

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ msg: 'Tenant not found' });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = tenantResolver;