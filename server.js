const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const reminderRoutes = require('./routes/reminder');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); console.log('Created uploads directory'); } catch (e) { console.warn('Could not create uploads dir', e.message || e); }
}
app.use('/uploads', express.static(uploadsDir));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000, 
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  try {
    require('./worker/agenda');
  } catch (e) {
    console.warn('Agenda worker not started:', e.message || e);
  }
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

app.use('/auth', authRoutes);
app.use('/reminder', reminderRoutes);

app.get('/status', (req, res) => {
  try {
    const mongoState = mongoose.connection?.readyState ?? null; 
    res.json({ ok: true, mongoState });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Expiry Date Tracker API is running!' });
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found', path: req.originalUrl });
});

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
