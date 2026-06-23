const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  source: { type: String, enum: ['homepage', 'popup', 'post', 'sidebar'], default: 'homepage' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
