require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/links');
const trackRoutes = require('./routes/track');
const pixelRoutes = require('./routes/pixels');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const httpServer = http.createServer(app);

// Socket.io for real-time click notifications
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so controllers can emit events
app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect MongoDB
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pixels', pixelRoutes);

// === THE MAGIC ROUTE ===
// Short link redirect + tracking (must be last, catches /:code)
app.use('/', trackRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join-link', (linkCode) => {
    socket.join(`link:${linkCode}`);
    console.log(`Socket joined room: link:${linkCode}`);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LinkTrack server running on http://localhost:${PORT}`);
});
