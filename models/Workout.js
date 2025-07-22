const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: String,
  sets: Number,
  reps: Number,
  duration: Number // in minutes
});

const WorkoutSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  exercises: [ExerciseSchema],
  notes: String
});

module.exports = mongoose.model('Workout', WorkoutSchema);