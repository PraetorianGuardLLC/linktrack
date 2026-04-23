const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many auth attempts' },
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, apiKey: user.apiKey },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, apiKey: user.apiKey },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ id: req.user._id, email: req.user.email, apiKey: req.user.apiKey });
});

// POST /api/auth/regenerate-key — regenerate API key
router.post('/regenerate-key', protect, async (req, res) => {
  try {
    const crypto = require('crypto');
    const newKey = crypto.randomBytes(24).toString('hex');
    await User.findByIdAndUpdate(req.user._id, { apiKey: newKey });
    res.json({ apiKey: newKey });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
