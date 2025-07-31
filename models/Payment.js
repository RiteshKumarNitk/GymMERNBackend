const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  description: {
    type: String
  },
  transactionId: {
    type: String
  },
  receiptNumber: {
    type: String
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);