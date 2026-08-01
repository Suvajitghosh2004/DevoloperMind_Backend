const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Category = require('../models/Category');
const Series = require('../models/Series');

router.get('/', async (req, res) => {
  try {
    const siteUrl = (process.env.CLIENT_URL || 'https://devolopermind.vercel.app').replace(/\/$/, '');

    const [posts, categories, series] = await Promise.all([
      Post.find({ status: 'published' }).select('slug updatedAt').sort({ updatedAt: -1 }),
      Category.find({ isActive: true }).select('slug updatedAt'),
      Series.find({ isActive: true }).select('slug updatedAt')
    ]);

    const staticPages = [
      { url: '',           priority: '1.0', changefreq: 'daily' },
      { url: '/tools',     priority: '0.9', changefreq: 'weekly' },
      { url: '/ai-news',   priority: '0.8', changefreq: 'daily' },
      { url: '/series',    priority: '0.7', changefreq: 'weekly' },
      { url: '/about',     priority: '0.5', changefreq: 'monthly' },
      { url: '/contact',   priority: '0.4', changefreq: 'monthly' },
      { url: '/advertise', priority: '0.4', changefreq: 'monthly' },
      { url: '/privacy',   priority: '0.3', changefreq: 'yearly' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${siteUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${categories.map(cat => `  <url>
    <loc>${siteUrl}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${series.map(s => `  <url>
    <loc>${siteUrl}/series/${s.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${posts.map(post => `  <url>
    <loc>${siteUrl}/post/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Sitemap generation failed');
  }
});

module.exports = router;