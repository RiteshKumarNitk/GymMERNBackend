const mongoose = require('mongoose');

const BusinessHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  open: {
    type: String,
    required: true
  },
  close: {
    type: String,
    required: true
  }
});

const LocationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'India'
  }
});

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
  status: {
    type: String,
    enum: ['active', 'inactive', 'trial', 'suspended'],
    default: 'trial'
  },
  subscriptionType: {
    type: String,
    enum: ['trial', 'monthly', 'biannual', 'annual'],
    default: 'trial'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    default: function() {
      const date = new Date();
      // Default trial period of 14 days
      date.setDate(date.getDate() + 14);
      return date;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String
  },
  businessDetails: {
    gstNumber: String,
    registrationNumber: String,
    businessType: {
      type: String,
      enum: ['sole_proprietorship', 'partnership', 'corporation', 'llc', 'other'],
      default: 'other'
    }
  },
  location: LocationSchema,
  billingAddress: {
    type: String
  },
  businessHours: [BusinessHoursSchema],
  autoRenew: {
    type: Boolean,
    default: false
  },
  lastBillingDate: Date,
  nextBillingDate: Date
});

module.exports = mongoose.model('Tenant', TenantSchema);