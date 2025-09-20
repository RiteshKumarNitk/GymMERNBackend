const Member = require('../models/Member');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const ROLES = require('../config/roles');
const { logger } = require('../utils/logger');

// @desc Create a new member with image upload
exports.createMember = async (req, res) => {
  const { name, email, phone, password, planType, trainerId, gender, dob, address } = req.body;

  try {
    if (!name || !phone || !planType || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, plan type and password are required'
      });
    }

    // Verify trainer exists if trainerId is given
    if (trainerId) {
      const trainer = await User.findOne({
        _id: trainerId,
        role: ROLES.TRAINER,
        tenantId: req.user.tenantId
      });

      if (!trainer) {
        return res.status(400).json({ success: false, error: 'Trainer not found' });
      }
    }

    const member = new Member({
      tenantId: req.user.tenantId,
      name,
      email,
      phone,
      password, // will be hashed by schema pre-save hook
      planType,
      address,
      image: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
          }
        : undefined,
      dob: dob ? new Date(dob) : null,
      gender,
      assignedTrainer: trainerId || null,
      joinDate: new Date()
    });

    await member.save();

    // Create workout plan if trainer assigned
    let workoutPlan = null;
    if (trainerId) {
      workoutPlan = new WorkoutPlan({
        memberId: member._id,
        trainerId,
        exercises: getDefaultPlan(planType),
        startDate: new Date(),
        endDate: calculateEndDate(planType)
      });
      await workoutPlan.save();
    }

    res.status(201).json({
      success: true,
      data: { 
        member: {
          _id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          planType: member.planType,
          gender: member.gender,
          dob: member.dob,
          address: member.address
        },
        workoutPlan 
      }
    });
  } catch (err) {
    logger.error(`CREATE MEMBER ERROR: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc Get all members
exports.getMembers = async (req, res) => {
  try {
    let query = { tenantId: req.user.tenantId };
    if (req.user.role === ROLES.TRAINER) {
      query.assignedTrainer = req.user._id;
    }

    const members = await Member.find(query)
      .select('-password') // hide password
      .populate('assignedTrainer', 'name email')
      .sort('-joinDate');

    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (err) {
    logger.error(`GET MEMBERS ERROR: ${err.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc Get member image by ID
exports.getMemberImage = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member || !member.image || !member.image.data) {
      return res.status(404).json({
        success: false,
        error: "Image not found"
      });
    }

    res.set("Content-Type", member.image.contentType);
    res.send(member.image.data);
  } catch (err) {
    logger.error(`GET MEMBER IMAGE ERROR: ${err.message}`);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.updateBMI = async (req, res) => {
  try {
    const { bmi } = req.body;

    // ✅ fix for BMI 0
    if (bmi === undefined || bmi === null) {
      return res.status(400).json({ success: false, error: "BMI is required" });
    }

    // Update member
    const member = await Member.findOneAndUpdate(
      { _id: req.user._id, tenantId: req.user.tenantId }, // make sure tenantId exists in JWT
      { bmi },
      { new: true }
    ).select("-password");

    if (!member) {
      return res.status(404).json({ success: false, error: "Member not found" });
    }

    res.json({ success: true, data: member });
  } catch (err) {
    logger.error(`UPDATE BMI ERROR: ${err.message}`);
    res.status(500).json({ success: false, error: "Server error" });
  }
};



// Helper functions
function getDefaultPlan(planType) {
  const plans = {
    basic: [
      { name: 'Cardio', sets: 3, reps: '20 mins', days: ['Mon', 'Wed', 'Fri'] },
      { name: 'Bodyweight Exercises', sets: 3, reps: 12, days: ['Tue', 'Thu'] }
    ],
    premium: [
      { name: 'Strength Training', sets: 4, reps: 10, days: ['Mon', 'Thu'] },
      { name: 'HIIT', sets: 3, reps: '15 mins', days: ['Tue', 'Fri'] },
      { name: 'Yoga', sets: 1, reps: '30 mins', days: ['Wed'] }
    ]
  };
  return plans[planType] || plans.basic;
}

function calculateEndDate(planType) {
  const durations = { basic: 1, premium: 3, elite: 6 };
  const date = new Date();
  date.setMonth(date.getMonth() + (durations[planType] || 1));
  return date;
}
