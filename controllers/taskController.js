// controllers/taskController.js
const Task = require('../models/Task');
const ROLES = require('../config/roles');
const { logger } = require('../utils/logger');

exports.assignTask = async (req, res) => {
  const { title, description, assignedTo, memberId, dueDate } = req.body;

  try {
    // Verify trainer exists
    const trainer = await User.findOne({
      _id: assignedTo,
      role: ROLES.TRAINER,
      tenantId: req.user.tenantId
    });
    
    if (!trainer) {
      return res.status(400).json({
        success: false,
        error: 'Valid trainer required'
      });
    }

    // Verify member exists
    const member = await Member.findOne({
      _id: memberId,
      tenantId: req.user.tenantId
    });
    
    if (!member) {
      return res.status(400).json({
        success: false,
        error: 'Member not found'
      });
    }

    const task = new Task({
      tenantId: req.user.tenantId,
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      memberId,
      dueDate
    });

    await task.save();

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (err) {
    logger.error(`Task assignment failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};