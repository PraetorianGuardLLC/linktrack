const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    targetUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = anonymous link
    },
    // Consent gate: show a consent page before redirecting
    consentRequired: {
      type: Boolean,
      default: false,
    },
    // Smart redirect: can serve different URLs based on device/OS
    smartRedirects: [
      {
        condition: { type: String, enum: ['ios', 'android', 'desktop', 'mobile'] },
        targetUrl: String,
      },
    ],
    // Password protection
    password: {
      type: String,
      default: null,
    },
    // Expiry
    expiresAt: {
      type: Date,
      default: null,
    },
    // Stats summary (denormalized for fast dashboard queries)
    totalClicks: {
      type: Number,
      default: 0,
    },
    uniqueIps: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Link', LinkSchema);
