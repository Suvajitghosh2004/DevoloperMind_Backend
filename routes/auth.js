const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    // Explicitly select password field (excluded by default via select:false on the schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Use updateOne instead of save() to avoid re-triggering the pre-save password hash hook
    await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

    res.json({ success: true, accessToken, refreshToken, user: user.toJSON() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token required' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const tokens = generateTokens(user._id);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: tokens.refreshToken } });

    res.json({ success: true, ...tokens });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $unset: { refreshToken: 1 } });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// --- Manual fallback routes ---
// The primary way to set the admin account is now ADMIN_EMAIL / ADMIN_PASSWORD
// in .env (auto-synced on every server start — see server/utils/seedAdmin.js).
// These routes are kept only as a manual escape hatch and are disabled in production.

// POST /api/auth/setup — create the very first admin if none exists yet
router.post('/setup', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production')
      return res.status(403).json({ success: false, message: 'Use ADMIN_EMAIL / ADMIN_PASSWORD in .env instead' });

    const count = await User.countDocuments();
    if (count > 0)
      return res.status(403).json({ success: false, message: 'Setup already complete' });

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });

    const user = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({ success: true, message: 'Admin created', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reset-admin — manually reset a known user's password (dev only)
router.post('/reset-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production')
      return res.status(403).json({ success: false, message: 'Use ADMIN_EMAIL / ADMIN_PASSWORD in .env instead' });

    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ success: false, message: 'email and newPassword required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
