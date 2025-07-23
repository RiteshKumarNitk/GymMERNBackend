const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  planType: {
    type: String,
    required: true,
    enum: ['basic', 'premium', 'elite'] 
  },
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  membershipEndDate: {
    type: Date
  }
});

module.exports = mongoose.model('Member', MemberSchema);