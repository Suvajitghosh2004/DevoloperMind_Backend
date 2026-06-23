const express = require('express');
const router = express.Router();
const NewsLink = require('../../models/NewsLink');
const { protect, adminOnly } = require('../../middleware/auth');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const news = await NewsLink.find().sort({ publishedAt: -1 });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newsLink = await NewsLink.create(req.body);
    res.status(201).json({ success: true, newsLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const newsLink = await NewsLink.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, newsLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await NewsLink.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'News link deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
