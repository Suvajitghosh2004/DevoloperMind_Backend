// Run with: node seed.js
// Seeds the 10 categories for DeveloperMind
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const categories = [
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence', color: '#6366F1', description: 'The latest breakthroughs, models, and applications in AI.' },
  { name: 'Machine Learning', slug: 'machine-learning', color: '#22D3EE', description: 'ML algorithms, training techniques, and research deep-dives.' },
  { name: 'Developer Tools', slug: 'developer-tools', color: '#10B981', description: 'IDEs, CLIs, frameworks, and tools that make developers more productive.' },
  { name: 'Startups & Funding', slug: 'startups-funding', color: '#F59E0B', description: 'Funding rounds, launches, and the startup ecosystem.' },
  { name: 'Cybersecurity', slug: 'cybersecurity', color: '#EF4444', description: 'Security research, vulnerabilities, and best practices.' },
  { name: 'Web3 & Blockchain', slug: 'web3-blockchain', color: '#8B5CF6', description: 'Blockchain technology, crypto, and decentralized applications.' },
  { name: 'Big Tech', slug: 'big-tech', color: '#3B82F6', description: 'Apple, Google, Microsoft, Meta, OpenAI, and the companies shaping tech.' },
  { name: 'Gadgets & Hardware', slug: 'gadgets-hardware', color: '#EC4899', description: 'Reviews and news on the latest devices and hardware.' },
  { name: 'Open Source', slug: 'open-source', color: '#14B8A6', description: 'Open source projects, releases, and community news.' },
  { name: 'Tutorials & How-Tos', slug: 'tutorials', color: '#F97316', description: 'Step-by-step guides to build, ship, and learn.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const cat of categories) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    console.log(`✅ Upserted category: ${cat.name}`);
  }

  console.log('Done seeding categories!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
