const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const Category = require('../../models/Category');
const { protect, adminOnly } = require('../../middleware/auth');
const slugify = require('slugify');
const { buildTableOfContents } = require('../../utils/tableOfContents');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'name')
      .populate('category', 'name slug')
      .select('-content')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, posts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('category', 'name slug')
      .populate('series', 'title slug');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, category, ...rest } = req.body;
    let slug = slugify(title, { lower: true, strict: true });

    const existing = await Post.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const { content: contentWithAnchors, tableOfContents } = buildTableOfContents(content);

    const post = await Post.create({
      title, content: contentWithAnchors, category, slug, tableOfContents,
      author: req.user._id,
      ...rest
    });

    await Category.findByIdAndUpdate(category, { $inc: { postCount: 1 } });
    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.content) {
      const { content, tableOfContents } = buildTableOfContents(updates.content);
      updates.content = content;
      updates.tableOfContents = tableOfContents;
    }

    const post = await Post.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;