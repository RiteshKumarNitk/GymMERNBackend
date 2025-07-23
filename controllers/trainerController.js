// controllers/trainerController.js
const User = require('../models/User');
const ROLES = require('../config/roles'); // Import without destructuring
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

exports.createTrainer = async (req, res) => {
  const { name, email, password, specialization } = req.body;

  // Input validation
  if (!name || !email || !password || !specialization) {
    return res.status(400).json({ 
      success: false,
      error: 'All fields are required' 
    });
  }

  try {
    // Check for existing user
    if (await User.findOne({ email })) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Create new trainer
    const trainer = new User({
      tenantId: req.user.tenantId,
      name,
      email,
      password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
      role: ROLES.TRAINER, // Using the imported ROLES
      specialization,
      createdAt: new Date()
    });

    await trainer.save();

    // Remove sensitive data before response
    const trainerResponse = trainer.toObject();
    delete trainerResponse.password;

    logger.info(`Trainer created by ${req.user.email}: ${trainer.email}`);
    
    res.status(201).json({
      success: true,
      data: trainerResponse
    });

  } catch (err) {
    logger.error(`Trainer creation failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({
      tenantId: req.user.tenantId,
      role: ROLES.TRAINER // Using the imported ROLES
    })
    .select('-password -__v')
    .sort({ createdAt: -1 });

    logger.info(`Retrieved ${trainers.length} trainers for ${req.user.tenantId}`);

    res.json({
      success: true,
      count: trainers.length,
      data: trainers
    });

  } catch (err) {
    logger.error(`Get trainers failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};