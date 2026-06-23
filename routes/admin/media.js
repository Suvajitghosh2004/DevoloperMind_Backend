const express = require('express');
const router = express.Router();
const { cloudinary, upload } = require('../../middleware/cloudinary');
const { protect, adminOnly } = require('../../middleware/auth');

router.use(protect, adminOnly);

// Upload image
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, url: req.file.path, publicId: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List all media from Cloudinary
router.get('/', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'developermind',
      max_results: 50
    });
    res.json({ success: true, resources: result.resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete media
router.delete('/:publicId', async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'Media deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
