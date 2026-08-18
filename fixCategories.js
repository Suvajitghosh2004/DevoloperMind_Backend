require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected\n');

  const db = mongoose.connection.db;

  // Show all categories in DB
  const cats = await db.collection('categories').find({}).toArray();
  console.log('All categories:');
  cats.forEach(c => console.log(`  [${c._id}] ${c.name} (${c.slug}) active:${c.isActive}`));

  // Show all posts and their category IDs
  const posts = await db.collection('posts').find({}, { projection: { title: 1, category: 1, status: 1 } }).toArray();
  console.log('\nAll posts:');
  posts.forEach(p => console.log(`  [${p._id}] "${p.title}" → category: ${p.category} status: ${p.status}`));

  // Find which post category IDs have no matching active category
  const activeCatIds = cats.filter(c => c.isActive).map(c => c._id.toString());
  const orphaned = posts.filter(p => p.category && !activeCatIds.includes(p.category.toString()));
  console.log(`\nOrphaned posts (category ID not found): ${orphaned.length}`);
  orphaned.forEach(p => console.log(`  "${p.title}" → missing category: ${p.category}`));

  await mongoose.disconnect();
  console.log('\nDone. Paste this output so I can generate the fix.');
}

fix().catch(e => { console.error(e); process.exit(1); });