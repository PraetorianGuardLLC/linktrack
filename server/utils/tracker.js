const axios = require('axios');
const { UAParser } = require('ua-parser-js');

/**
 * Look up geolocation for an IP address using ip-api.com (free, 45 req/min)
 */
const geoLookup = async (ip) => {
  // Skip private/localhost IPs
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return {
      country: 'Localhost',
      countryCode: 'LH',
      region: '',
      regionName: '',
      city: 'Local',
      zip: '',
      lat: null,
      lon: null,
      timezone: '',
      isp: 'Local Network',
      org: '',
      isProxy: false,
      isVpn: false,
    };
  }

  try {
    const { data } = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,proxy,hosting`,
      { timeout: 3000 }
    );

    if (data.status !== 'success') return defaultGeo();

    return {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || '',
      region: data.region || '',
      regionName: data.regionName || '',
      city: data.city || '',
      zip: data.zip || '',
      lat: data.lat || null,
      lon: data.lon || null,
      timezone: data.timezone || '',
      isp: data.isp || '',
      org: data.org || '',
      isProxy: data.proxy || false,
      isVpn: data.hosting || false,
    };
  } catch (err) {
    console.warn('GeoIP lookup failed:', err.message);
    return defaultGeo();
  }
};

const defaultGeo = () => ({
  country: 'Unknown',
  countryCode: '',
  region: '',
  regionName: '',
  city: '',
  zip: '',
  lat: null,
  lon: null,
  timezone: '',
  isp: '',
  org: '',
  isProxy: false,
  isVpn: false,
});

/**
 * Parse User-Agent string into device/browser/OS info
 */
const parseUserAgent = (uaString) => {
  const parser = new UAParser(uaString || '');
  const result = parser.getResult();

  return {
    device: {
      type: result.device?.type || 'desktop',
      brand: result.device?.vendor || '',
      model: result.device?.model || '',
    },
    os: {
      name: result.os?.name || '',
      version: result.os?.version || '',
    },
    browser: {
      name: result.browser?.name || '',
      version: result.browser?.version || '',
    },
    engine: {
      name: result.engine?.name || '',
    },
  };
};

/**
 * Get real IP from request, accounting for proxies
 */
const getRealIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
};

/**
 * Extract domain from referer URL
 */
const getRefererDomain = (referer) => {
  if (!referer) return 'Direct';
  try {
    const url = new URL(referer);
    return url.hostname.replace('www.', '');
  } catch {
    return referer;
  }
};

module.exports = { geoLookup, parseUserAgent, getRealIp, getRefererDomain };
