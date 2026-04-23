const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Pixel = require('../models/Pixel');
const Click = require('../models/Click');
const { protect, optionalAuth } = require('../middleware/auth');

// POST /api/pixels — create a tracking pixel
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const pixelCode = nanoid(10);

    const pixel = await Pixel.create({
      pixelCode,
      title: title || 'Untitled Pixel',
      owner: req.user?._id || null,
    });

    const pixelUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/pixel/${pixelCode}.png`;
    const embedHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;

    res.status(201).json({ ...pixel.toObject(), pixelUrl, embedHtml });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/pixels — list user's pixels
router.get('/', protect, async (req, res) => {
  try {
    const pixels = await Pixel.find({ owner: req.user._id }).sort({ createdAt: -1 });

    const enriched = pixels.map((p) => ({
      ...p.toObject(),
      pixelUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/pixel/${p.pixelCode}.png`,
      embedHtml: `<img src="${process.env.SERVER_URL || 'http://localhost:5000'}/pixel/${p.pixelCode}.png" width="1" height="1" style="display:none" alt="" />`,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/pixels/:code/clicks — get clicks for a pixel
router.get('/:code/clicks', protect, async (req, res) => {
  try {
    const pixel = await Pixel.findOne({ pixelCode: req.params.code, owner: req.user._id });
    if (!pixel) return res.status(404).json({ message: 'Pixel not found' });

    const clicks = await Click.find({ shortCode: req.params.code, source: 'pixel' })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ pixel, clicks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
