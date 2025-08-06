const mongoose = require('mongoose');

// Reusable sub-schema for business hours
const BusinessHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
  },
  open: { type: String, required: true },
  close: { type: String, required: true },
});

// Reusable sub-schema for location
const LocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
}, { _id: false });

// Main tenant schema
const TenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String },
  ownerName: { type: String, required: true },

  subscriptionType: {
    type: String,
    enum: ['trial', 'monthly', 'biannual', 'annual'],
    default: 'trial',
  },
  subscriptionStartDate: { type: Date, default: Date.now },
  subscriptionEndDate: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setDate(date.getDate() + 14); // 14-day trial by default
      return date;
    },
  },
  autoRenew: { type: Boolean, default: false },

  onboardingStatus: {
    type: String,
    enum: ['pending', 'setup_in_progress', 'completed'],
    default: 'pending',
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'trial', 'suspended'],
    default: 'active',
  },

  location: LocationSchema,

  billingAddress: { type: String },

  businessDetails: {
    gstNumber: { type: String },
    registrationNumber: { type: String },
    businessType: {
      type: String,
      enum: ['fitness_center',
        'yoga_studio',
        'martial_arts_school',
        'personal_training',
        'crossfit_box',
        'other'],
      default: 'other',
    },
  },

  businessHours: [BusinessHoursSchema],

  branding: {
    logoUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
  },

  paymentGateway: {
    stripeCustomerId: { type: String },
    razorpayCustomerId: { type: String },
    billingEmail: { type: String },
  },

  features: {
    enableReports: { type: Boolean, default: true },
    enableAttendance: { type: Boolean, default: true },
    enableChat: { type: Boolean, default: false },
  },

  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
});


// Indexes for performance
TenantSchema.index({ tenantId: 1 });
TenantSchema.index({ domain: 1 });
TenantSchema.index({ status: 1 });

module.exports = mongoose.model('Tenant', TenantSchema);
