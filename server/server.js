const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 5000);

function startServer(port) {
  const server = app.listen(port, () => {
    const displayPort = server.address().port;
    console.log(`=======================================================`);
    console.log(`🦐 AQUA FARMING MERN Server Running on Port ${displayPort}`);
    console.log(`🔗 Local Access: http://localhost:${displayPort}`);
    console.log(`=======================================================`);
    if (displayPort !== DEFAULT_PORT) {
      console.log(`⚠️ Port ${DEFAULT_PORT} was busy, so the server started on ${displayPort}.`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = port + 1;
      console.log(`⚠️ Port ${port} is busy. Trying ${fallbackPort}...`);
      startServer(fallbackPort);
      return;
    }

    console.error(err);
    process.exit(1);
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'aqua_farming_secret_jwt_key_2026');
    } catch (err) {
      req.user = null;
    }
  }
  next();
});

// Static Files (Frontend assets, background image, PWA manifest)
app.use(express.static(path.join(__dirname, '../')));

// MongoDB Mongoose Connection setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aqua_farming';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('🍃 MongoDB Connected Successfully via Mongoose'))
  .catch((err) => {
    console.log('⚡ MongoDB local server not detected - Running in resilient Hybrid MERN Mode.');
  });

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/pondRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Serve Frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server
startServer(DEFAULT_PORT);
