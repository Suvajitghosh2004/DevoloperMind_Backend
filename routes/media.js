const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/cloudinary');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/upload', protect, adminOnly, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, url: req.file.path, publicId: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
