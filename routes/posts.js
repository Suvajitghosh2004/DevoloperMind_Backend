const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Analytics = require('../models/Analytics');

// GET /api/posts - All published posts (paginated, filterable)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, tag, search, series } = req.query;
    const query = { status: 'published' };

    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (series) query.series = series;
    if (search) query.$text = { $search: search };

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .populate('series', 'title slug')
      .select('-content')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, posts, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/trending - Most viewed last 7 days
router.get('/trending', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.find({ status: 'published', createdAt: { $gte: sevenDaysAgo } })
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .select('-content')
      .sort({ views: -1 })
      .limit(5);
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/featured - Latest featured/top post
router.get('/featured', async (req, res) => {
  try {
    const post = await Post.findOne({ status: 'published' })
      .populate('author', 'name avatar bio')
      .populate('category', 'name slug color')
      .sort({ views: -1, createdAt: -1 });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/:slug - Single post
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'name avatar bio socialLinks')
      .populate('category', 'name slug color')
      .populate('series', 'title slug description');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Increment views
    post.views += 1;
    await post.save();

    // Track analytics
    await Analytics.create({ post: post._id, ip: req.ip });

    // Get related posts
    const related = await Post.find({
      category: post.category._id,
      status: 'published',
      _id: { $ne: post._id }
    })
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .select('-content')
      .limit(4);

    res.json({ success: true, post, related });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
