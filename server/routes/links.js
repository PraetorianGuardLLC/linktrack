const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const rateLimit = require('express-rate-limit');
const Link = require('../models/Link');
const { protect, optionalAuth } = require('../middleware/auth');

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many links created, slow down.' },
});

// POST /api/links — create a new tracked link
router.post('/', createLimiter, optionalAuth, async (req, res) => {
  try {
    const {
      targetUrl,
      title,
      customCode,
      consentRequired = false,
      expiresAt,
      smartRedirects,
    } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ message: 'targetUrl is required' });
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Resolve short code
    let shortCode = customCode || nanoid(7);

    // Check collision
    if (customCode) {
      const existing = await Link.findOne({ shortCode: customCode });
      if (existing) {
        return res.status(409).json({ message: 'Custom code already taken' });
      }
    }

    const link = await Link.create({
      shortCode,
      targetUrl,
      title: title || new URL(targetUrl).hostname,
      owner: req.user?._id || null,
      consentRequired,
      expiresAt: expiresAt || null,
      smartRedirects: smartRedirects || [],
    });

    const trackingUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/${shortCode}`;

    res.status(201).json({
      ...link.toObject(),
      trackingUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/links — get all links for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const links = await Link.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    const enriched = links.map((l) => ({
      ...l.toObject(),
      trackingUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/${l.shortCode}`,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/links/:code — get one link
router.get('/:code', optionalAuth, async (req, res) => {
  try {
    const link = await Link.findOne({ shortCode: req.params.code });
    if (!link) return res.status(404).json({ message: 'Link not found' });

    // If owned, verify ownership (allow admins)
    if (link.owner && (!req.user || link.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      ...link.toObject(),
      trackingUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/${link.shortCode}`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/links/:code
router.delete('/:code', protect, async (req, res) => {
  try {
    const link = await Link.findOne({ shortCode: req.params.code, owner: req.user._id });
    if (!link) return res.status(404).json({ message: 'Link not found or unauthorized' });
    await link.deleteOne();
    res.json({ message: 'Link deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/links/:code — update link
router.patch('/:code', protect, async (req, res) => {
  try {
    const link = await Link.findOne({ shortCode: req.params.code, owner: req.user._id });
    if (!link) return res.status(404).json({ message: 'Link not found or unauthorized' });

    const allowed = ['title', 'targetUrl', 'consentRequired', 'expiresAt', 'isActive', 'smartRedirects'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) link[field] = req.body[field];
    });

    await link.save();
    res.json(link);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
