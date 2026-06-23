const mongoose = require('mongoose');

const newsLinkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  sourceName: { type: String },
  sourceUrl: { type: String, required: true },
  summary: { type: String, maxlength: 400 },
  category: { type: String, default: 'Artificial Intelligence' },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

newsLinkSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('NewsLink', newsLinkSchema);
