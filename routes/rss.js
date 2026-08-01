const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

const SITE_URL = (process.env.CLIENT_URL || 'https://devolopermind.vercel.app').replace(/\/$/, '');
const SITE_NAME = 'DeveloperMind';
const SITE_DESC = 'AI, developer tools, startups, and the tech shaping tomorrow.';

// GET /rss.xml
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'name')
      .populate('category', 'name')
      .select('title slug excerpt content author category createdAt updatedAt thumbnail')
      .sort({ createdAt: -1 })
      .limit(50);

    const escape = str => (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
`;

    posts.forEach(post => {
      const url = `${SITE_URL}/post/${post.slug}`;
      const description = escape(post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 200));
      rss += `
    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <dc:creator>${escape(post.author?.name || 'DeveloperMind')}</dc:creator>
      <category>${escape(post.category?.name || 'Technology')}</category>
      <description>${description}</description>
      ${post.thumbnail ? `<media:content url="${post.thumbnail}" medium="image"/>` : ''}
    </item>`;
    });

    rss += `\n  </channel>\n</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.send(rss);
  } catch (err) {
    res.status(500).send('Error generating RSS feed');
  }
});

module.exports = router;