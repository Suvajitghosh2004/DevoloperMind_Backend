// One-time fix: re-links posts from stale Web3 category to the active one
// Run: node fix.js
require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const db = mongoose.connection.db;

  const OLD_ID = new mongoose.Types.ObjectId('6a361806755cc39a8197e8cd'); // web3-and-blockchain (stale)
  const NEW_ID = new mongoose.Types.ObjectId('6a4773ac429dc28d3a562ab5'); // web3-blockchain (active)

  // Re-link all posts pointing to old category id
  const result = await db.collection('posts').updateMany(
    { category: OLD_ID },
    { $set: { category: NEW_ID } }
  );
  console.log('Posts re-linked:', result.modifiedCount);

  // Delete the stale category doc
  await db.collection('categories').deleteOne({ _id: OLD_ID });
  console.log('Stale category doc deleted');

  // Confirm
  const posts = await db.collection('posts').find({ category: NEW_ID }).toArray();
  console.log('Web3 posts now:', posts.length);
  posts.forEach(p => console.log(' -', p.title, '(' + p.status + ')'));

  await mongoose.disconnect();
  console.log('Done');
}

fix().catch(e => { console.error(e); process.exit(1); });