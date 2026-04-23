# LinkTrack 🔗

**Your private, self-hosted IP logger and URL tracker.** A free, no-ads alternative to Grabify built on the MERN stack.

---

## Features

| Feature | Description |
|---|---|
| 🔗 Tracked short links | Create short links that capture full visitor data |
| 📍 IP + Geolocation | Country, city, lat/lon, ISP, proxy/VPN detection |
| 🖥️ Device fingerprinting | Browser, OS, device type, user agent |
| 📊 Real-time analytics | Live click feed via WebSocket (Socket.io) |
| 🗺️ Charts & maps | Recharts-powered analytics dashboard |
| 🖼️ Tracking pixels | 1×1 invisible PNG for email open tracking |
| ✅ Consent gate | GDPR-friendly consent page before redirect |
| 🔀 Smart redirects | Different URLs for iOS / Android / Desktop |
| 👤 Auth | JWT-based register/login, API key for scripts |
| ⏱️ Link expiry | Set expiration dates on links |

---

## Stack

- **Backend**: Node.js · Express · MongoDB/Mongoose · Socket.io · JWT
- **Frontend**: React 18 · Vite · TailwindCSS · Recharts · Socket.io-client
- **Geo**: ip-api.com (free, 45 req/min) — no API key needed
- **UA Parsing**: ua-parser-js

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (local: `mongod` or MongoDB Atlas free tier)

### 2. Clone & Install

```bash
git clone <your-repo>
cd linktrack

# Install all dependencies
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment

```bash
# In /server directory
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET
```

### 4. Run development servers

```bash
# Terminal 1 — API + WebSocket server
cd server && npm run dev

# Terminal 2 — React dev server
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

---

## How It Works

### Link Creation
```
POST /api/links
{ "targetUrl": "https://example.com", "title": "My Link" }

Response: { shortCode: "abc1234", trackingUrl: "http://localhost:5000/abc1234" }
```

### When someone clicks the tracking URL:
1. Request hits `GET /:code` on Express
2. Server looks up the link in MongoDB
3. **Asynchronously** (non-blocking):
   - Extracts real IP from headers
   - Queries ip-api.com for geolocation
   - Parses User-Agent for device/browser/OS
   - Saves Click document to MongoDB
   - Emits `new-click` event via Socket.io to your dashboard
4. **Immediately** redirects user to target URL

### Analytics endpoint
```
GET /api/analytics/:code
Returns: summary, charts (by country/browser/OS/device), recent clicks, time series
```

---

## Project Structure

```
linktrack/
├── server/
│   ├── index.js              # Express app + Socket.io setup
│   ├── config/db.js          # MongoDB connection
│   ├── models/
│   │   ├── Link.js           # Short link schema
│   │   ├── Click.js          # Click capture schema (all tracking data)
│   │   ├── User.js           # Auth user schema
│   │   └── Pixel.js          # Email tracking pixel schema
│   ├── routes/
│   │   ├── track.js          # /:code redirect + capture (CORE)
│   │   ├── links.js          # CRUD for links
│   │   ├── analytics.js      # Aggregation queries
│   │   ├── pixels.js         # Pixel management
│   │   └── auth.js           # JWT auth
│   ├── middleware/auth.js    # JWT protect middleware
│   └── utils/tracker.js     # GeoIP + UA parser utilities
└── client/
    └── src/
        ├── pages/
        │   ├── HomePage.jsx      # Link creation
        │   ├── DashboardPage.jsx # Link list
        │   ├── AnalyticsPage.jsx # Full analytics + real-time
        │   ├── PixelsPage.jsx    # Email pixel management
        │   ├── ConsentPage.jsx   # GDPR consent gate
        │   ├── LoginPage.jsx
        │   └── RegisterPage.jsx
        ├── context/AuthContext.jsx
        └── api/
            ├── client.js        # Axios instance
            └── links.js         # API helpers
```

---

## Next Steps to Build

- [ ] **Map view** — plot clicks on a world map (use react-leaflet)
- [ ] **Link expander tool** — paste a short URL, reveal destination without visiting
- [ ] **CSV export** — export all clicks for a link
- [ ] **Email alerts** — notify on first click
- [ ] **Webhook support** — POST to your endpoint on each click
- [ ] **Custom domain** — serve links from your own domain
- [ ] **Dark/light mode toggle**
- [ ] **Password-protected links**
- [ ] **QR code generation** per link
- [ ] **Admin panel** — see all links across users

---

## Privacy & Legal

This tool is for **personal use** on links you own or share yourself. Usage to track others without consent may be illegal in your jurisdiction. The consent gate feature is provided for GDPR compliance — enable it on any link shared publicly.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/linktrack` | MongoDB connection string |
| `JWT_SECRET` | — | **Required** — change this! |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `CLIENT_URL` | `http://localhost:5173` | React dev server URL (CORS) |
| `SERVER_URL` | `http://localhost:5000` | Public server URL (for tracking URLs) |
