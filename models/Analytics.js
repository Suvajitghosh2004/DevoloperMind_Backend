const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  date: { type: Date, default: () => new Date().setHours(0,0,0,0) },
  views: { type: Number, default: 1 },
  ip: { type: String }
});

analyticsSchema.index({ post: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
