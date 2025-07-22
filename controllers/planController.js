const Plan = require('../models/Plan');

exports.createPlan = async (req, res) => {
  const { name, description, price, duration, features } = req.body;
  
  try {
    const plan = new Plan({
      tenantId: req.user.tenantId,
      name,
      description,
      price,
      duration,
      features
    });

    await plan.save();

    res.status(201).json(plan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ tenantId: req.user.tenantId });
    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};