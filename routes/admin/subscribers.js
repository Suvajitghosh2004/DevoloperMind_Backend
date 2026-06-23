const express = require('express');
const router = express.Router();
const Subscriber = require('../../models/Subscriber');
const nodemailer = require('nodemailer');
const { protect, adminOnly } = require('../../middleware/auth');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await Subscriber.countDocuments({ isActive: true });
    const subscribers = await Subscriber.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, subscribers, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export CSV
router.get('/export', async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true }).select('email name createdAt');
    const csv = ['email,name,date', ...subscribers.map(s => `${s.email},${s.name || ''},${s.createdAt.toISOString()}`)].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send broadcast email
router.post('/broadcast', async (req, res) => {
  try {
    const { subject, html } = req.body;
    const subscribers = await Subscriber.find({ isActive: true }).select('email');
    const emails = subscribers.map(s => s.email);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: `DeveloperMind <${process.env.EMAIL_USER}>`,
      bcc: emails,
      subject,
      html
    });

    res.json({ success: true, message: `Broadcast sent to ${emails.length} subscribers` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
