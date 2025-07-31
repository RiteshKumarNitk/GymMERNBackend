const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    ref: 'Tenant'
  },
  plan: {
    type: String,
    enum: ['trial', 'monthly', 'biannual', 'annual'],
    default: 'trial',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date,
  renewalReminderSent: {
    type: Boolean,
    default: false
  },
  renewalReminderDate: Date,
  invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  features: {
    maxUsers: {
      type: Number,
      default: 5
    },
    maxMembers: {
      type: Number,
      default: 100
    },
    advancedReports: {
      type: Boolean,
      default: false
    },
    multipleLocations: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Calculate end date based on plan if not provided
SubscriptionSchema.pre('save', function(next) {
  if (!this.endDate) {
    const date = new Date(this.startDate);
    
    switch(this.plan) {
      case 'trial':
        date.setDate(date.getDate() + 14); // 14 days trial
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'biannual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }
    
    this.endDate = date;
  }
  
  next();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);