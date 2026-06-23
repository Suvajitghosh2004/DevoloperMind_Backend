const express = require('express');
const router = express.Router();
const NewsLink = require('../models/NewsLink');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const query = {};
    if (category) query.category = category;

    const total = await NewsLink.countDocuments(query);
    const news = await NewsLink.find(query)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, news, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
