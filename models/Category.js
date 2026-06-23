const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, maxlength: 300 },
  color: { type: String, default: '#6366F1' },
  icon: { type: String },
  metaTitle: { type: String },
  metaDescription: { type: String },
  postCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', categorySchema);
