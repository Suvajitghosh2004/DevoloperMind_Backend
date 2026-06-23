const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

router.post('/', async (req, res) => {
  try {
    const { email, name, source } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (existing.isActive) return res.json({ success: true, message: 'Already subscribed!' });
      existing.isActive = true;
      await existing.save();
      return res.json({ success: true, message: 'Welcome back! Resubscribed.' });
    }

    await Subscriber.create({ email, name, source });
    res.status(201).json({ success: true, message: 'Subscribed! You\'re on the list.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
