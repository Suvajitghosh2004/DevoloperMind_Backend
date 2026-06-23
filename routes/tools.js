const express = require('express');
const router = express.Router();
const ToolListing = require('../models/ToolListing');

router.get('/', async (req, res) => {
  try {
    const { category, sponsored } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (sponsored === 'true') query.isSponsored = true;

    const tools = await ToolListing.find(query).sort({ isSponsored: -1, rating: -1, createdAt: -1 });
    res.json({ success: true, tools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const tool = await ToolListing.findOne({ slug: req.params.slug, isActive: true });
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
    res.json({ success: true, tool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
