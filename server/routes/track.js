const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Link = require('../models/Link');
const Click = require('../models/Click');
const Pixel = require('../models/Pixel');
const { geoLookup, parseUserAgent, getRealIp, getRefererDomain } = require('../utils/tracker');

/**
 * Core tracking logic - called for both link clicks and pixel hits
 */
const captureClick = async (req, { link, pixelId, source = 'link', consentGiven = false }) => {
  const ip = getRealIp(req);
  const ua = req.headers['user-agent'] || '';
  const referer = req.headers.referer || req.headers.referrer || '';

  const [geo, parsed] = await Promise.all([
    geoLookup(ip),
    Promise.resolve(parseUserAgent(ua)),
  ]);

  const clickData = {
    link: link?._id || null,
    shortCode: link?.shortCode || pixelId,
    ip,
    geo,
    ...parsed,
    userAgent: ua,
    referer: referer || 'Direct',
    refererDomain: getRefererDomain(referer),
    acceptLanguage: req.headers['accept-language'] || '',
    consentGiven,
    source,
  };

  const click = await Click.create(clickData);

  // Update denormalized stats on Link
  if (link) {
    const uniqueCount = await Click.distinct('ip', { shortCode: link.shortCode });
    await Link.findByIdAndUpdate(link._id, {
      $inc: { totalClicks: 1 },
      $set: { uniqueIps: uniqueCount.length },
    });
  }

  // Emit real-time event via Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(`link:${link?.shortCode || pixelId}`).emit('new-click', {
      ip: click.ip,
      city: click.geo.city,
      country: click.geo.country,
      countryCode: click.geo.countryCode,
      browser: click.browser.name,
      os: click.os.name,
      device: click.device.type,
      createdAt: click.createdAt,
    });
  }

  return click;
};

/**
 * GET /:code — redirect short link + capture click
 */
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  // Skip API/static routes
  if (code.startsWith('api') || code === 'favicon.ico') return res.status(404).end();

  try {
    const link = await Link.findOne({ shortCode: code, isActive: true });

    if (!link) {
      return res.status(404).send('<h1>Link not found</h1>');
    }

    // Check expiry
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).send('<h1>This link has expired</h1>');
    }

    // If consent required, show consent page first
    if (link.consentRequired && !req.query.consent) {
      return res.redirect(`${process.env.CLIENT_URL}/consent/${code}`);
    }

    const consentGiven = req.query.consent === '1';

    // Smart redirect by device
    let targetUrl = link.targetUrl;
    if (link.smartRedirects?.length) {
      const ua = parseUserAgent(req.headers['user-agent']);
      const deviceType = ua.device.type;
      const match = link.smartRedirects.find(
        (r) => r.condition === deviceType || (r.condition === 'mobile' && deviceType !== 'desktop')
      );
      if (match) targetUrl = match.targetUrl;
    }

    // Capture click asynchronously — don't block redirect
    captureClick(req, { link, source: 'link', consentGiven }).catch(console.error);

    return res.redirect(302, targetUrl);
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).send('Server error');
  }
});

/**
 * GET /pixel/:code.png — 1x1 transparent pixel for email tracking
 */
router.get('/pixel/:code.png', async (req, res) => {
  const { code } = req.params;

  try {
    const pixel = await Pixel.findOne({ pixelCode: code, isActive: true });

    if (pixel) {
      await Pixel.findByIdAndUpdate(pixel._id, { $inc: { totalHits: 1 } });
      captureClick(req, { link: null, pixelId: code, source: 'pixel' }).catch(console.error);
    }

    // Serve a 1x1 transparent PNG
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': png.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    return res.end(png);
  } catch (err) {
    console.error('Pixel error:', err);
    res.status(500).end();
  }
});

module.exports = router;
