const mongoose = require('mongoose');

const toolListingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  description: { type: String, maxlength: 300 },
  category: { type: String, enum: ['AI Writing', 'Code Assistant', 'Design', 'Productivity', 'Data', 'DevOps', 'Security', 'Database', 'Cloud', 'Other'] },
  affiliateUrl: { type: String },
  websiteUrl: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  badge: { type: String }, // e.g. "Free Tier", "#1 AI Tool"
  isSponsored: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ToolListing', toolListingSchema);
