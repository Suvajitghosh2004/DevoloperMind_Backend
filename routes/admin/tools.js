const express = require('express');
const router = express.Router();
const ToolListing = require('../../models/ToolListing');
const { protect, adminOnly } = require('../../middleware/auth');
const slugify = require('slugify');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const tools = await ToolListing.find().sort({ createdAt: -1 });
    res.json({ success: true, tools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, ...rest } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const tool = await ToolListing.create({ name, slug, ...rest });
    res.status(201).json({ success: true, tool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tool = await ToolListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, tool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ToolListing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tool deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
