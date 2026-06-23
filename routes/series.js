const express = require('express');
const router = express.Router();
const Series = require('../models/Series');
const Post = require('../models/Post');

router.get('/', async (req, res) => {
  try {
    const series = await Series.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, series });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const series = await Series.findOne({ slug: req.params.slug, isActive: true });
    if (!series) return res.status(404).json({ success: false, message: 'Series not found' });

    const posts = await Post.find({ series: series._id, status: 'published' })
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .select('-content')
      .sort({ seriesOrder: 1, createdAt: 1 });

    res.json({ success: true, series, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
