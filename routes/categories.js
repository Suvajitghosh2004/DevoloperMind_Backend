const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { getOrSet, TTL } = require('../utils/cache');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await getOrSet('categories_all', async () => {
      return Category.find({ isActive: true }).sort({ name: 1 });
    }, TTL.LONG);

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await getOrSet(`category_${req.params.slug}`, async () => {
      return Category.findOne({ slug: req.params.slug, isActive: true });
    }, TTL.LONG);

    // Return 404 for inactive or non-existent categories
    // CategoryPage uses this to show the "not found" UI instead of an empty page
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
