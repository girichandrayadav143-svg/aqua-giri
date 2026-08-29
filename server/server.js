const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS — allow all origins (works on localhost AND Render production) ──
app.use(cors({
  origin: true,           // reflect request origin — allows any domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.options('*', cors());  // pre-flight for all routes

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Async JWT auth middleware
const { authenticateTokenOptional } = require('./middleware/authenticate');
app.use(authenticateTokenOptional);

// Static Files (Frontend)
app.use(express.static(path.join(__dirname, '../')));

// ── MongoDB Connection ──
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI && !MONGODB_URI.includes('127.0.0.1') && !MONGODB_URI.includes('localhost')) {
  // Production MongoDB Atlas connection
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
  })
    .then(() => console.log('🍃 MongoDB Atlas Connected Successfully'))
    .catch(err => {
      console.error('❌ MongoDB Atlas connection failed:', err.message);
      console.log('⚡ Running in in-memory fallback mode (data resets on restart)');
    });
} else if (MONGODB_URI && (MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('localhost'))) {
  // Local MongoDB
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 5000,
  })
    .then(() => console.log('🍃 MongoDB Local Connected Successfully'))
    .catch(() => {
      console.log('⚡ Local MongoDB not available - using in-memory mode');
    });
} else {
  console.log('⚡ No MONGODB_URI set - running in in-memory mode');
}

// ── Health Check endpoint ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mode: mongoose.connection.readyState === 1 ? 'database' : 'in-memory',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ── API Routes ──
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/pondRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/pond-investments', require('./routes/pondInvestmentRoutes'));

// ── Serve Frontend SPA (must be LAST) ──
app.get('*', (req, res) => {
  // Only serve HTML for non-API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`🦐 AQUA FARMING Server Running on Port ${PORT}`);
  console.log(`🔗 Local Access: http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log('=======================================================');
});
