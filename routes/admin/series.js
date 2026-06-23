const express = require('express');
const router = express.Router();
const Series = require('../../models/Series');
const { protect, adminOnly } = require('../../middleware/auth');
const slugify = require('slugify');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const series = await Series.find().sort({ createdAt: -1 });
    res.json({ success: true, series });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, ...rest } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    const series = await Series.create({ title, slug, ...rest });
    res.status(201).json({ success: true, series });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const series = await Series.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, series });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Series.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Series deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
