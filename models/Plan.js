const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in months
    required: true
  },
  features: [String]
});

module.exports = mongoose.model('Plan', PlanSchema);