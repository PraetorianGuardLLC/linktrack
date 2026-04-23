const mongoose = require('mongoose');

const ClickSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    // Network
    ip: { type: String, default: 'unknown' },
    ipv6: { type: String, default: null },

    // Geolocation (from ip-api.com free tier)
    geo: {
      country: { type: String, default: 'Unknown' },
      countryCode: { type: String, default: '' },
      region: { type: String, default: '' },
      regionName: { type: String, default: '' },
      city: { type: String, default: '' },
      zip: { type: String, default: '' },
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
      timezone: { type: String, default: '' },
      isp: { type: String, default: '' },
      org: { type: String, default: '' },
      isProxy: { type: Boolean, default: false },
      isVpn: { type: Boolean, default: false },
    },

    // Browser / Device (from ua-parser-js)
    device: {
      type: { type: String, default: 'desktop' }, // desktop | mobile | tablet
      brand: { type: String, default: '' },
      model: { type: String, default: '' },
    },
    os: {
      name: { type: String, default: '' },
      version: { type: String, default: '' },
    },
    browser: {
      name: { type: String, default: '' },
      version: { type: String, default: '' },
    },
    engine: {
      name: { type: String, default: '' },
    },

    // Raw user agent
    userAgent: { type: String, default: '' },

    // Referrer
    referer: { type: String, default: 'Direct' },
    refererDomain: { type: String, default: 'Direct' },

    // Screen / hardware fingerprint headers
    screenWidth: { type: Number, default: null },
    screenHeight: { type: Number, default: null },
    language: { type: String, default: '' },

    // Accept-Language header
    acceptLanguage: { type: String, default: '' },

    // Was consent given (for consent-gated links)
    consentGiven: { type: Boolean, default: false },

    // Pixel or link click
    source: { type: String, enum: ['link', 'pixel'], default: 'link' },
  },
  { timestamps: true }
);

// Index for fast analytics queries
ClickSchema.index({ shortCode: 1, createdAt: -1 });
ClickSchema.index({ 'geo.countryCode': 1 });

module.exports = mongoose.model('Click', ClickSchema);
