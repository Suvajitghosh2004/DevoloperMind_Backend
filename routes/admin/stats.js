const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Subscriber = require('../../models/Subscriber');
const Analytics = require('../../models/Analytics');
const { protect, adminOnly } = require('../../middleware/auth');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const [totalPosts, totalComments, totalSubscribers, pendingComments] = await Promise.all([
      Post.countDocuments({ status: 'published' }),
      Comment.countDocuments({ status: 'approved' }),
      Subscriber.countDocuments({ isActive: true }),
      Comment.countDocuments({ status: 'pending' })
    ]);

    const totalViews = await Post.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const topPosts = await Post.find({ status: 'published', createdAt: { $gte: sevenDaysAgo } })
      .select('title slug views createdAt')
      .sort({ views: -1 })
      .limit(5);

    const recentComments = await Comment.find({ status: 'pending' })
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalPosts,
        totalComments,
        totalSubscribers,
        pendingComments,
        totalViews: totalViews[0]?.total || 0
      },
      topPosts,
      recentComments
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
