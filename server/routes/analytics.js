const express = require('express');
const router = express.Router();
const Click = require('../models/Click');
const Link = require('../models/Link');
const { protect } = require('../middleware/auth');

// GET /api/analytics/:code — full analytics for a link
router.get('/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;
    const { limit = 50, page = 1, from, to } = req.query;

    // Verify ownership
    const link = await Link.findOne({ shortCode: code, owner: req.user._id });
    if (!link) return res.status(404).json({ message: 'Link not found or unauthorized' });

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const matchStage = { shortCode: code };
    if (Object.keys(dateFilter).length) matchStage.createdAt = dateFilter;

    // Run all aggregations in parallel
    const [
      recentClicks,
      totalClicks,
      uniqueIps,
      byCountry,
      byBrowser,
      byOS,
      byDevice,
      byReferer,
      clicksOverTime,
    ] = await Promise.all([
      // Recent clicks list
      Click.find(matchStage)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),

      // Total count
      Click.countDocuments(matchStage),

      // Unique IPs
      Click.distinct('ip', matchStage).then((ips) => ips.length),

      // By country
      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: { country: '$geo.country', countryCode: '$geo.countryCode' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // By browser
      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$browser.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // By OS
      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$os.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // By device type
      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$device.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // By referer domain
      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$refererDomain', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Clicks over time (last 30 days by day)
      Click.aggregate([
        {
          $match: {
            shortCode: code,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      link: {
        shortCode: link.shortCode,
        targetUrl: link.targetUrl,
        title: link.title,
        createdAt: link.createdAt,
      },
      summary: {
        totalClicks,
        uniqueIps,
      },
      recentClicks,
      charts: {
        byCountry: byCountry.map((d) => ({
          country: d._id.country,
          countryCode: d._id.countryCode,
          count: d.count,
        })),
        byBrowser: byBrowser.map((d) => ({ name: d._id || 'Unknown', count: d.count })),
        byOS: byOS.map((d) => ({ name: d._id || 'Unknown', count: d.count })),
        byDevice: byDevice.map((d) => ({ name: d._id || 'unknown', count: d.count })),
        byReferer: byReferer.map((d) => ({ name: d._id || 'Direct', count: d.count })),
        clicksOverTime: clicksOverTime.map((d) => ({ date: d._id, count: d.count })),
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalClicks,
        pages: Math.ceil(totalClicks / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
