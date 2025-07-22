const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  contactEmail: {
    type: String,
    required: true
  },
  billingAddress: {
    type: String
  }
});

module.exports = mongoose.model('Tenant', TenantSchema);