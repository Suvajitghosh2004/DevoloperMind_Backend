// Run with: node seed.js
// Seeds categories for DeveloperMind — only keeps the ones listed as active.
// Any category not in this list will be set to isActive: false (hidden).
require('dotenv').config();
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  color: String, isActive: Boolean, postCount: { type: Number, default: 0 }
});
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// These are the ONLY active categories — edit this list to add/remove.
const ACTIVE_CATEGORIES = [
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence', color: '#6366F1', description: 'The latest breakthroughs, models, and applications in AI.' },
  { name: 'Machine Learning', slug: 'machine-learning', color: '#22D3EE', description: 'ML algorithms, training techniques, and research deep-dives.' },
  { name: 'Developer Tools', slug: 'developer-tools', color: '#10B981', description: 'IDEs, CLIs, frameworks, and tools that make developers more productive.' },
  { name: 'Cybersecurity', slug: 'cybersecurity', color: '#EF4444', description: 'Security research, vulnerabilities, and best practices.' },
  { name: 'Web3 & Blockchain', slug: 'web3-blockchain', color: '#8B5CF6', description: 'Blockchain technology, crypto, and decentralized applications.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const activeSlugs = ACTIVE_CATEGORIES.map(c => c.slug);

  // Upsert active categories
  for (const cat of ACTIVE_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { ...cat, isActive: true },
      { upsert: true, new: true }
    );
    console.log(`✅ Active: ${cat.name}`);
  }

  // Deactivate any category NOT in the active list
  const result = await Category.updateMany(
    { slug: { $nin: activeSlugs } },
    { $set: { isActive: false } }
  );
  if (result.modifiedCount > 0) {
    console.log(`⚫ Deactivated ${result.modifiedCount} unused categories`);
  }

  console.log('\nDone! Active categories:', activeSlugs.join(', '));
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});