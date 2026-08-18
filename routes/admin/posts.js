const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const Category = require('../../models/Category');
const { protect, adminOnly } = require('../../middleware/auth');
const slugify = require('slugify');
const { buildTableOfContents } = require('../../utils/tableOfContents');

// DOMPurify for server-side HTML sanitization
// Prevents stored XSS attacks via post content
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Allowed HTML tags and attributes for post content
// Covers everything TipTap outputs — nothing more
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
    'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'iframe',        // YouTube embeds from TipTap
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',        // links
    'src', 'alt', 'width', 'height', 'loading', // images
    'id', 'class',                  // anchors + styling
    'data-caption',                 // our custom caption marker
    'style',                        // inline styles from TipTap tables
    'allowfullscreen', 'frameborder', // YouTube iframes
    'data-youtube-video',           // TipTap YouTube wrapper
    'colspan', 'rowspan',           // table cells
  ],
  // Allow YouTube iframes only — block all other iframe sources
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Force all links to open safely
  FORCE_BODY: true,
  // Keep data- attributes we use
  ADD_ATTR: ['data-caption', 'data-youtube-video'],
};

// Sanitize HTML and strip dangerous content
function sanitizeContent(html) {
  if (!html) return html;

  // Allow YouTube iframes specifically (DOMPurify strips all iframes by default)
  // We mark them safe before sanitizing, then restore
  const youtubeRegex = /<iframe[^>]*src="https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[^"]*"[^>]*>(?:<\/iframe>)?/gi;
  const youtubePlaceholders = [];
  let sanitized = html.replace(youtubeRegex, (match) => {
    const idx = youtubePlaceholders.length;
    youtubePlaceholders.push(match);
    return `<p data-youtube-placeholder="${idx}"></p>`;
  });

  // Sanitize everything else
  sanitized = DOMPurify.sanitize(sanitized, SANITIZE_CONFIG);

  // Restore YouTube iframes
  youtubePlaceholders.forEach((iframe, idx) => {
    sanitized = sanitized.replace(
      `<p data-youtube-placeholder="${idx}"></p>`,
      iframe
    );
  });

  return sanitized;
}

router.use(protect, adminOnly);

// GET /api/admin/posts
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

// GET /api/admin/posts/:id
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

// POST /api/admin/posts
router.post('/', async (req, res) => {
  try {
    const { title, content, category, ...rest } = req.body;
    let slug = slugify(title, { lower: true, strict: true });

    const existing = await Post.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Sanitize HTML before saving — prevents stored XSS
    const cleanContent = sanitizeContent(content);

    // Auto-generate TOC from H2/H3 headings and inject anchor ids
    const { content: contentWithAnchors, tableOfContents } = buildTableOfContents(cleanContent);

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

// PUT /api/admin/posts/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };

    // Sanitize and rebuild TOC whenever content is updated
    if (updates.content) {
      const cleanContent = sanitizeContent(updates.content);
      const { content, tableOfContents } = buildTableOfContents(cleanContent);
      updates.content = content;
      updates.tableOfContents = tableOfContents;
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/posts/:id
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