const mongoose = require('mongoose');
const GymSchema = new mongoose.Schema({
  name: String,
  address: String,
  plan: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Gym', GymSchema);