const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, maxlength: 300 },
  content: { type: String, required: true },
  thumbnail: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
  scheduledAt: { type: Date },
  metaTitle: { type: String },
  metaDescription: { type: String },
  ogImage: { type: String },
  focusKeyword: { type: String },
  canonicalUrl: { type: String },
  readTime: { type: Number, default: 5 },
  views: { type: Number, default: 0 },
  isAIAssisted: { type: Boolean, default: false },
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  seriesOrder: { type: Number },
  codeLanguage: { type: String, default: 'javascript' },
  tableOfContents: [{ heading: String, anchor: String, level: Number }],
  affiliateCards: [{ toolName: String, affiliateUrl: String, description: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Auto-calculate read time (~200 words/min)
  const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  next();
});

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

module.exports = mongoose.model('Post', postSchema);
