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

const io = new Server(httpServer, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pixels', pixelRoutes);
app.use('/', trackRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join-link', (linkCode) => {
    socket.join(`link:${linkCode}`);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LinkTrack server running on http://localhost:${PORT}`);
});
