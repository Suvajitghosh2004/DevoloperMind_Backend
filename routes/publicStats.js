const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Subscriber = require('../models/Subscriber');

// GET /api/stats — public, safe aggregate numbers only (no auth, no PII)
// Used on public pages (e.g. Advertise) so displayed numbers are always real.
router.get('/', async (req, res) => {
  try {
    const [totalPosts, totalSubscribers] = await Promise.all([
      Post.countDocuments({ status: 'published' }),
      Subscriber.countDocuments({ isActive: true })
    ]);

    const totalViewsAgg = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalPosts,
        totalSubscribers,
        totalViews: totalViewsAgg[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
