const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Category = require('../models/Category');
const Series = require('../models/Series');

const SITE_URL = process.env.CLIENT_URL || 'https://developermind.vercel.app';

// GET /sitemap.xml
router.get('/', async (req, res) => {
  try {
    const [posts, categories, series] = await Promise.all([
      Post.find({ status: 'published' })
        .select('slug updatedAt createdAt')
        .sort({ createdAt: -1 }),
      Category.find({ isActive: true }).select('slug updatedAt'),
      Series.find({ isActive: true }).select('slug updatedAt')
    ]);

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/tools', priority: '0.9', changefreq: 'weekly' },
      { url: '/ai-news', priority: '0.8', changefreq: 'daily' },
      { url: '/series', priority: '0.7', changefreq: 'weekly' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/contact', priority: '0.4', changefreq: 'monthly' },
      { url: '/advertise', priority: '0.4', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    ];

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Static pages
    staticPages.forEach(({ url, priority, changefreq }) => {
      xml += `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
    });

    // Category pages
    categories.forEach(cat => {
      xml += `  <url>
    <loc>${SITE_URL}/category/${cat.slug}</loc>
    <lastmod>${(cat.updatedAt || new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Series pages
    series.forEach(s => {
      xml += `  <url>
    <loc>${SITE_URL}/series/${s.slug}</loc>
    <lastmod>${(s.updatedAt || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Blog posts — highest SEO value
    posts.forEach(post => {
      xml += `  <url>
    <loc>${SITE_URL}/post/${post.slug}</loc>
    <lastmod>${(post.updatedAt || post.createdAt || new Date()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1hr
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;