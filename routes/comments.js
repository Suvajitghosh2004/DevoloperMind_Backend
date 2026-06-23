const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const rateLimit = require('express-rate-limit');

const commentLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, status: 'approved' })
      .sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/comments
router.post('/', commentLimit, async (req, res) => {
  try {
    const { post, name, email, content } = req.body;
    if (!post || !name || !email || !content) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const comment = await Comment.create({ post, name, email, content, ip: req.ip });
    res.status(201).json({ success: true, message: 'Comment submitted for review', comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
