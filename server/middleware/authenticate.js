/**
 * Authentication Middleware
 * Verifies JWT token and attaches authenticated user to request
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aqua_farming_secret_jwt_key_2026';

const mongoose = require('mongoose');

async function getOwnerIdForUser(decoded) {
  if (decoded.ownerId) {
    return decoded.ownerId;
  }
  
  const role = String(decoded.role || '').toLowerCase();
  if (role === 'owner') {
    return decoded.userId;
  }
  
  // Try MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const userDoc = await User.findOne({ userId: decoded.userId }).lean();
      if (userDoc) {
        return userDoc.ownerId;
      }
    }
  } catch (err) {
    console.error('Error resolving ownerId in auth middleware:', err);
  }
  
  // Try global in-memory fallback list
  if (global.inMemoryUsers) {
    const memUser = global.inMemoryUsers.find(u => u.userId === decoded.userId);
    if (memUser) {
      return memUser.ownerId;
    }
  }
  
  // Fallback for pre-seeded users
  const seedUsersMap = {
    'rajesh': 'A7#d2!',
    'ramu': 'A7#d2!'
  };
  return seedUsersMap[decoded.username] || decoded.userId;
}

/**
 * Middleware to verify JWT and attach user to request
 * Used on protected routes that require authentication
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  
  // Extract token from "Bearer <token>"
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Authentication required. Please login first.',
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.slice(7);

  try {
    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    const ownerId = await getOwnerIdForUser(decoded);
    
    // Attach authenticated user to request
    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      ownerId: ownerId
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Your session has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      message: 'Invalid or malformed authentication token.',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Optional authentication - continues if token valid, otherwise continues with req.user = null
 */
async function authenticateTokenOptional(req, res, next) {
  const authHeader = req.headers.authorization || '';
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const ownerId = await getOwnerIdForUser(decoded);
      req.user = {
        id: decoded.id,
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        ownerId: ownerId
      };
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
}

module.exports = {
  authenticateToken,
  authenticateTokenOptional
};
