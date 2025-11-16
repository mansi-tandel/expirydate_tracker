const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const reminderRoutes = require('./routes/reminder');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Lightweight request logger to aid debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

// Serve uploaded files
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); console.log('Created uploads directory'); } catch (e) { console.warn('Could not create uploads dir', e.message || e); }
}
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  // Start Agenda worker after connection established
  try {
    require('./worker/agenda');
  } catch (e) {
    console.warn('Agenda worker not started:', e.message || e);
  }
  // Start cron worker (node-cron) after DB connection is ready
  try {
    require('./worker/cron');
  } catch (e) {
    console.warn('Cron worker not started:', e.message || e);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  if (err && err.stack) {
    console.error('Stack trace:', err.stack);
  }
  console.log('Please check:');
  console.log('1. Your IP address is whitelisted in MongoDB Atlas');
  console.log('2. Your connection string is correct');
  console.log('3. Your MongoDB Atlas cluster is running');
});

// Routes
app.use('/auth', authRoutes);
app.use('/reminder', reminderRoutes);

// Simple status endpoint to help debug connectivity
app.get('/status', (req, res) => {
  try {
    const mongoState = mongoose.connection?.readyState ?? null; // 0 = disconnected, 1 = connected
    res.json({ ok: true, mongoState });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Expiry Date Tracker API is running!' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found', path: req.originalUrl });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err && err.stack) {
    console.error('Stack trace:', err.stack);
  }
  if (res.headersSent) {
    return;
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

let PORT = parseInt(process.env.PORT, 10) || 5000;

// Enhanced server startup with port conflict handling (numeric increments)
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const next = Number(port) + 1;
      console.log(`Port ${port} is already in use. Trying port ${next}...`);
      server.close();
      startServer(next);
    } else {
      console.error('Server error:', error);
    }
  });

  return server;
};

startServer(PORT);
