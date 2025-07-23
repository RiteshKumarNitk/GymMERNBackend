// controllers/planController.js
const Plan = require('../models/Plan');
const { logger } = require('../utils/logger');

exports.createPlan = async (req, res) => {
  const { name, description, price, duration, features } = req.body;

  try {
    // Validate duration (months)
    if (duration < 1 || duration > 36) {
      return res.status(400).json({ 
        msg: 'Duration must be between 1-36 months' 
      });
    }

    const plan = new Plan({
      tenantId: req.user.tenantId,
      name,
      description,
      price,
      duration,
      features: features || []
    });

    await plan.save();

    logger.info(`Plan created: ${plan.name} by ${req.user.email}`);
    res.status(201).json(plan);

  } catch (err) {
    logger.error(`Plan creation failed: ${err.message}`);
    res.status(500).json({ 
      msg: 'Server error',
      error: err.message 
    });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ tenantId: req.user.tenantId });
    res.json(plans);
  } catch (err) {
    logger.error(`Failed to fetch plans: ${err.message}`);
    res.status(500).json({ 
      msg: 'Server error',
      error: err.message 
    });
  }
};