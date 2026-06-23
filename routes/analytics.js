const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// POST /api/analytics/track - track a page view
router.post('/track', async (req, res) => {
  try {
    const { postId } = req.body;
    if (postId) await Analytics.create({ post: postId, ip: req.ip });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
