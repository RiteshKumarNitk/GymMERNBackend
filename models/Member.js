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
  plan: {
    type: String,
    required: true
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