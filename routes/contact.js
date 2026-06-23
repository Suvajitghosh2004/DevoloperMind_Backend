const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const contactLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

router.post('/', contactLimit, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message required' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      replyTo: email,
      subject: subject || `Contact from ${name} — DeveloperMind`,
      html: `<h3>New contact from DeveloperMind</h3>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong></p>
             <p>${message}</p>`
    });

    res.json({ success: true, message: 'Message sent!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;
