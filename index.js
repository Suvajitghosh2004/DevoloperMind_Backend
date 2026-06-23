const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Allow requests from local dev and any configured production frontend URLs.
// Set CLIENT_URL in Render env vars to your Vercel domain.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again shortly.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/news', require('./routes/news'));
app.use('/api/series', require('./routes/series'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/media', require('./routes/media'));
app.use('/api/stats', require('./routes/publicStats'));

// Admin routes
app.use('/api/admin/posts', require('./routes/admin/posts'));
app.use('/api/admin/categories', require('./routes/admin/categories'));
app.use('/api/admin/comments', require('./routes/admin/comments'));
app.use('/api/admin/subscribers', require('./routes/admin/subscribers'));
app.use('/api/admin/tools', require('./routes/admin/tools'));
app.use('/api/admin/news', require('./routes/admin/news'));
app.use('/api/admin/series', require('./routes/admin/series'));
app.use('/api/admin/media', require('./routes/admin/media'));
app.use('/api/admin/stats', require('./routes/admin/stats'));

// Health check + keep-alive ping for Render free tier
app.get('/health', (req, res) => res.json({ status: 'OK', project: 'DeveloperMind', env: process.env.NODE_ENV }));
app.get('/ping', (req, res) => res.send('pong'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;
const seedAdminFromEnv = require('./utils/seedAdmin');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedAdminFromEnv();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;