const express = require('express');
const router = express.Router();
const Subscriber = require('../../models/Subscriber');
const rateLimit = require('express-rate-limit');

const subscribeLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 200);
}

router.post('/', subscribeLimit, async (req, res) => {
  try {
    const { email, name, source } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const cleanEmail = email.toLowerCase().trim().slice(0, 254);
    const cleanName = sanitizeText(name);

    const existing = await Subscriber.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.isActive) {
        return res.json({ success: true, message: 'Already subscribed!' });
      }
      existing.isActive = true;
      await existing.save();
      return res.json({ success: true, message: 'Welcome back! Resubscribed.' });
    }

    await Subscriber.create({ email: cleanEmail, name: cleanName, source });
    res.status(201).json({ success: true, message: "Subscribed! You're on the list." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
