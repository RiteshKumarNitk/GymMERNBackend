const Member = require('../models/Member');
const User = require('../models/User');
const ROLES = require('../config/roles');
const { validateMemberInput } = require('../utils/validators');

const WorkoutPlan = require('../models/WorkoutPlan');
const { logger } = require('../utils/logger');


exports.createMember = async (req, res) => {
  const { name, email, phone, planType, trainerId } = req.body;

  try {
    console.log('Request Body:', req.body); // Log incoming request
    
    // Basic validation
    if (!name || !phone || !planType) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ 
        success: false,
        error: 'Name, phone and plan type are required' 
      });
    }

    // Verify trainer exists if assigned
    if (trainerId) {
      console.log('Checking trainer:', trainerId);
      const trainer = await User.findOne({
        _id: trainerId,
        role: ROLES.TRAINER,
        tenantId: req.user.tenantId
      });
      
      if (!trainer) {
        console.log('Trainer not found');
        return res.status(400).json({
          success: false,
          error: 'Trainer not found'
        });
      }
    }

    // Create member
    const member = new Member({
      tenantId: req.user.tenantId,
      name,
      email,
      phone,
      planType,
      assignedTrainer: trainerId || null,
      joinDate: new Date()
    });

    await member.save();
    console.log('Member created:', member._id);

    // Create default workout plan if trainer assigned
    let workoutPlan = null;
    if (trainerId) {
      console.log('Creating workout plan...');
      workoutPlan = new WorkoutPlan({
        memberId: member._id,
        trainerId,
        exercises: getDefaultPlan(planType),
        startDate: new Date(),
        endDate: calculateEndDate(planType)
      });
      await workoutPlan.save();
      console.log('Workout plan created:', workoutPlan._id);
    }

    res.status(201).json({
      success: true,
      data: {
        member,
        workoutPlan
      }
    });

  } catch (err) {
    console.error('CREATE MEMBER ERROR:', err); // Detailed error log
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Helper functions
function getDefaultPlan(planType) {
  const plans = {
    basic: [
      { name: "Cardio", sets: 3, reps: "20 mins", days: ["Mon", "Wed", "Fri"] },
      { name: "Bodyweight Exercises", sets: 3, reps: 12, days: ["Tue", "Thu"] }
    ],
    premium: [
      { name: "Strength Training", sets: 4, reps: 10, days: ["Mon", "Thu"] },
      { name: "HIIT", sets: 3, reps: "15 mins", days: ["Tue", "Fri"] },
      { name: "Yoga", sets: 1, reps: "30 mins", days: ["Wed"] }
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


exports.getMembers = async (req, res) => {
  try {
    // Basic query
    let query = { tenantId: req.user.tenantId };

    // Optional trainer filter
    if (req.user.role === 'trainer') {
      query.assignedTrainer = req.user._id;
    }

    const members = await Member.find(query)
      .populate('assignedTrainer', 'name email')
      .sort('-joinDate');

    logger.info(`${members.length} members retrieved by ${req.user.email}`);
    res.json({
      success: true,
      count: members.length,
      data: members
    });

  } catch (err) {
    logger.error(`Get members error: ${err.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Server error'
    });
  }
};


// @desc    Create a new member
// @route   POST /api/members
// @access  Private (FrontDesk, Manager, Owner)
// exports.createMember = async (req, res) => {
//   const { name, email, phone, plan, assignedTrainer } = req.body;
  
//   // Input validation
//   const { errors, isValid } = validateMemberInput(req.body);
//   if (!isValid) {
//     logger.warn(`Member creation validation failed: ${JSON.stringify(errors)}`);
//     return res.status(400).json(errors);
//   }

//   try {
//     // Verify trainer exists if assigned
//     if (assignedTrainer) {
//       const trainerExists = await User.findOne({
//         _id: assignedTrainer,
//         tenantId: req.user.tenantId,
//         role: 'trainer'
//       });
      
//       if (!trainerExists) {
//         logger.warn(`Trainer not found: ${assignedTrainer}`);
//         return res.status(400).json({ msg: 'Assigned trainer not found' });
//       }
//     }

//     // Create new member
//     const member = new Member({
//       tenantId: req.user.tenantId,
//       name,
//       email,
//       phone,
//       plan,
//       assignedTrainer: assignedTrainer || null,
//       joinDate: new Date()
//     });

//     await member.save();

//     logger.info(`Member created: ${member.name} (${member._id}) by ${req.user.email}`);
//     res.status(201).json({
//       success: true,
//       data: member
//     });

//   } catch (err) {
//     logger.error(`Member creation error: ${err.message}`);
//     res.status(500).json({ 
//       success: false,
//       error: 'Server error',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// };

// @desc    Get all members
// @route   GET /api/members
// @access  Private (FrontDesk, Manager, Owner, Trainer)
