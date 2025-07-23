// models/WorkoutPlan.js
const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: String,
  sets: Number,
  reps: mongoose.Schema.Types.Mixed, // Can be number or string like "15 mins"
  days: [String],
  notes: String
});

const WorkoutPlanSchema = new mongoose.Schema({
  tenantId: String,
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercises: [ExerciseSchema],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
});

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);