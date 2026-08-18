const express = require('express');
const router = express.Router();
const Comment = require('../../models/Comment');
const rateLimit = require('express-rate-limit');

const commentLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// Strip all HTML from comment text — comments are plain text only
function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')           // remove all HTML tags
    .replace(/&[a-z#0-9]+;/gi, ' ')   // decode HTML entities to space
    .replace(/javascript:/gi, '')      // remove javascript: protocol
    .trim()
    .slice(0, 1000);                   // enforce max length
}

function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .trim()
    .slice(0, 200);
}

// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      status: 'approved'
    }).sort({ createdAt: -1 });
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Strip all HTML from comment fields — comments are plain text only
    const cleanComment = await Comment.create({
      post,
      name: sanitizeText(name),
      email: email.toLowerCase().trim().slice(0, 200),
      content: stripHtml(content),
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Comment submitted for review',
      comment: cleanComment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
