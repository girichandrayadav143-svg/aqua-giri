const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
const { canManageUsers, canViewOwnProfile } = require('../utils/userAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'aqua_farming_secret_jwt_key_2026';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate a unique 6-character User ID
 * Format: Mix of uppercase, lowercase, numbers, and symbols
 */
function generateUserId() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@#$%&!';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let userId = '';
  
  // Ensure at least one of each type
  userId += uppercase[Math.floor(Math.random() * uppercase.length)];
  userId += lowercase[Math.floor(Math.random() * lowercase.length)];
  userId += numbers[Math.floor(Math.random() * numbers.length)];
  userId += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining characters
  for (let i = 0; i < 2; i++) {
    userId += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the string
  return userId.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a unique User ID that doesn't exist in database
 */
async function generateUniqueUserId() {
  let userId = generateUserId();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    let existing = false;

    if (isMongoReady()) {
      existing = !!(await User.findOne({ userId }));
    } else {
      existing = inMemoryUsers.some(u => u.userId === userId);
    }

    if (!existing) {
      return userId;
    }
    userId = generateUserId();
    attempts++;
  }
  
  throw new Error('Failed to generate unique User ID after multiple attempts');
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const passedChecks = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strength = passedChecks <= 1 ? 'Weak' : passedChecks === 2 ? 'Medium' : 'Strong';

  return {
    isValid: minLength && hasUppercase && hasLowercase && (hasNumber || hasSpecial),
    strength,
    details: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial
    }
  };
}

// In-Memory Pre-seeded Users for Out-of-the-box instant running
// In-Memory Pre-seeded Users for Out-of-the-box instant running
const seedUsers = [

  { username: 'manthena', userId: 'A7#d2!', passwordHash: bcrypt.hashSync('owner123', 8), name: 'Bhatraju Raju', email: 'owner@aquafarm.io', role: 'owner', ownerId: 'A7#d2!' },
  { username: 'giri', userId: 'G1r!23', passwordHash: bcrypt.hashSync('owner@123', 8), name: 'Giri', email: 'giri@aquafarm.io', role: 'owner', ownerId: 'G1r!23' },
  { username: 'rajesh', userId: 'k9@P4$', passwordHash: bcrypt.hashSync('super123', 8), name: 'Rajesh Kumar', email: 'rajesh@aquafarm.io', role: 'supervisor', ownerId: 'A7#d2!' },
  { username: 'ramu', userId: 'M&5xQ1', passwordHash: bcrypt.hashSync('servant123', 8), name: 'Ramu', email: 'ramu@aquafarm.io', role: 'servant', ownerId: 'A7#d2!' }
];

// Store for used passwords (in production, check against hashed DB values)
const usedPasswords = new Set(seedUsers.map(u => u.passwordHash));
const inMemoryUsers = [];
global.inMemoryUsers = inMemoryUsers;

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function sanitizeUser(user) {
  const { password, _id, __v, ...safeUser } = user;
  return safeUser;
}

function getMemoryUserByQuery(query) {
  const normalizedUsername = String(query.username || '').toLowerCase().trim();
  const normalizedEmail = String(query.email || '').toLowerCase().trim();
  const normalizedUserId = String(query.userId || '').trim();

  return inMemoryUsers.find(user => {
    if (normalizedUsername && user.username === normalizedUsername) return true;
    if (normalizedEmail && user.email === normalizedEmail) return true;
    if (normalizedUserId && user.userId === normalizedUserId) return true;
    return false;
  }) || null;
}

function getMemoryUserById(id) {
  return inMemoryUsers.find(user => String(user._id || user.id || user.userId) === String(id)) || null;
}

function ensureSeedUsersInMemory() {
  for (const seedUser of seedUsers) {
    const existing = getMemoryUserByQuery({ username: seedUser.username, email: seedUser.email, userId: seedUser.userId });
    if (existing) {
      existing.userId = existing.userId || seedUser.userId;
      existing.ownerId = existing.ownerId || seedUser.ownerId;
      existing.name = existing.name || seedUser.name;
      existing.email = existing.email || seedUser.email;
      existing.password = existing.password || seedUser.passwordHash;
      existing.role = existing.role || seedUser.role;
      existing.isActive = existing.isActive !== false;
      continue;
    }

    inMemoryUsers.push({
      _id: `memory-${seedUser.username}`,
      userId: seedUser.userId,
      ownerId: seedUser.ownerId,
      username: seedUser.username.toLowerCase().trim(),
      email: seedUser.email,
      name: seedUser.name,
      password: seedUser.passwordHash,
      role: seedUser.role,
      isActive: true,
      isSuspended: false,
      forcePasswordChange: false,
      assignedPonds: [],
      profilePhoto: '',
      accountNotes: '',
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

async function ensureSeedUsers() {
  ensureSeedUsersInMemory();

  if (!isMongoReady()) {
    return;
  }

  for (const seedUser of seedUsers) {
    const existing = await User.findOne({ username: seedUser.username.toLowerCase().trim() });
    if (existing) {
      existing.userId = existing.userId || seedUser.userId;
      existing.ownerId = existing.ownerId || seedUser.ownerId;
      existing.name = existing.name || seedUser.name;
      existing.email = existing.email || seedUser.email;
      existing.password = existing.password || seedUser.passwordHash;
      existing.role = existing.role || seedUser.role;
      existing.isActive = existing.isActive !== false;
      await existing.save();
      continue;
    }

    const newUser = new User({
      userId: seedUser.userId,
      ownerId: seedUser.ownerId,
      username: seedUser.username.toLowerCase().trim(),
      email: seedUser.email,
      name: seedUser.name,
      password: seedUser.passwordHash,
      role: seedUser.role,
      registrationDate: new Date()
    });

    await newUser.save();
  }
}

// ==================== ROUTES ====================

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  console.log('📨 Signup request received');
  
  // Set headers to ensure proper response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { name, email, mobileNumber, username, password, confirmPassword } = req.body;
    
    console.log('📋 Validating input: name, email, username...');

    // Validate input
    if (!name || !email || !username || !password || !confirmPassword) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'All required fields must be filled.' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Passwords do not match.' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address.' 
      });
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet strength requirements.',
        requirements: passwordStrength.details
      });
    }

    // Check if username already exists
    const existingUsername = isMongoReady()
      ? await User.findOne({ username: username.toLowerCase().trim() })
      : getMemoryUserByQuery({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(409).json({ 
        message: 'This username is already taken. Please choose another username.' 
      });
    }

    // Check if email already exists
    const existingEmail = isMongoReady()
      ? await User.findOne({ email: email.toLowerCase().trim() })
      : getMemoryUserByQuery({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({ 
        message: 'This email is already registered. Please use a different email.' 
      });
    }

    // Generate unique User ID
    const userId = await generateUniqueUserId();

    // Create new user (password provided by the registering user)
    const newUser = new User({
      userId,
      ownerId: userId, // Set ownerId same as userId for Owners
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      mobileNumber: mobileNumber || '',
      password: bcrypt.hashSync(password, 8),
      role: 'owner', // Default role for public registration is Owner
      registrationDate: new Date()
    });

    let savedUser = null;
    if (isMongoReady()) {
      try {
        console.log('💾 Saving new user to MongoDB:', username);
        savedUser = await newUser.save();
        console.log('✅ User saved to MongoDB. ID:', savedUser.userId);
      } catch (dbErr) {
        console.error('⚠️ MongoDB save failed, falling back to in-memory:', dbErr.message);
        // Fall through to in-memory below
      }
    }

    if (!savedUser) {
      // In-memory fallback (used when MongoDB is unavailable)
      savedUser = {
        _id: `memory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        userId,
        ownerId: userId,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        mobileNumber: mobileNumber || '',
        password: bcrypt.hashSync(password, 8),
        role: 'owner',
        registrationDate: new Date(),
        isActive: true,
        isSuspended: false,
        forcePasswordChange: false,
        assignedPonds: [],
        profilePhoto: '',
        accountNotes: '',
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryUsers.push(savedUser);
      console.log('✅ User saved in-memory. ID:', savedUser.userId);
    }

    // Create JWT token
    console.log('🔐 Creating JWT token...');
    const token = jwt.sign(
      { 
        id: savedUser._id, 
        userId: savedUser.userId,
        username: savedUser.username, 
        role: savedUser.role, 
        name: savedUser.name,
        email: savedUser.email,
        ownerId: savedUser.ownerId // Include ownerId in JWT payload
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Account created successfully! Sending response...');
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: savedUser._id,
        userId: savedUser.userId,
        username: savedUser.username,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        ownerId: savedUser.ownerId
      }
    });
    console.log('✅ Response sent successfully');

  } catch (err) {
    console.error('❌ SIGNUP ERROR:', err.message);
    console.error('Error stack:', err.stack);
    
    // Handle specific database errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      console.log(`⚠️ Duplicate ${field}`);
      return res.status(409).json({ 
        message: `This ${field} is already registered. Please use a different one.` 
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      console.log('⚠️ Validation error:', messages);
      return res.status(400).json({ 
        message: `Validation failed: ${messages.join(', ')}`
      });
    }
    
    // Generic server error
    const errorMsg = 'Server error during registration. Please try again later.';
    console.error(`📛 Returning 500 error: ${errorMsg}`);
    res.status(500).json({ 
      message: errorMsg,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Login with User ID or Username + Password
 */
router.post('/login', async (req, res) => {
  try {
    await ensureSeedUsers();
    const { credential, username, password } = req.body;
    const loginCredential = (credential || username || '').toString().trim();

    if (!loginCredential || !password) {
      return res.status(400).json({ message: 'User ID/Username and Password are required.' });
    }

    // Check seed users first (for demo/testing)
    const matchSeed = seedUsers.find(u => 
      u.username === loginCredential.toLowerCase() || u.userId === loginCredential
    );
    
    if (matchSeed) {
      const isValid = bcrypt.compareSync(password, matchSeed.passwordHash);
      if (isValid) {
        const token = jwt.sign(
          { 
            userId: matchSeed.userId,
            username: matchSeed.username, 
            role: matchSeed.role, 
            name: matchSeed.name,
            email: matchSeed.email,
            ownerId: matchSeed.ownerId
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({
          message: 'Login successful!',
          token,
          user: { 
            userId: matchSeed.userId,
            username: matchSeed.username, 
            role: matchSeed.role, 
            name: matchSeed.name,
            email: matchSeed.email,
            ownerId: matchSeed.ownerId
          }
        });
      }
    }

    // Check database users
    let user = null;
    if (isMongoReady()) {
      user = await User.findOne({
        $or: [
          { username: loginCredential.toLowerCase().trim() },
          { userId: loginCredential },
          { email: loginCredential.toLowerCase().trim() }
        ]
      });
    } else {
      user = getMemoryUserByQuery({
        username: loginCredential,
        email: loginCredential,
        userId: loginCredential
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid User ID/Username or Password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid User ID/Username or Password.' });
    }

    if (!user.isActive || user.isSuspended) {
      return res.status(403).json({ message: 'This account is currently inactive or suspended.' });
    }

    // Update last login
    user.lastLogin = new Date();
    const pendingNotice = user.pendingNotice || '';
    user.pendingNotice = '';
    if (isMongoReady()) {
      await user.save();
    }

    const userOwnerId = user.ownerId || (user.role === 'owner' ? user.userId : 'A7#d2!');

    const token = jwt.sign(
      { 
        id: user._id, 
        userId: user.userId,
        username: user.username, 
        email: user.email,
        role: user.role, 
        name: user.name,
        ownerId: userOwnerId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      notice: pendingNotice || undefined,
      user: { 
        id: user._id,
        userId: user.userId,
        username: user.username, 
        email: user.email,
        role: user.role, 
        name: user.name,
        ownerId: userOwnerId
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
});

/**
 * POST /api/auth/validate-username
 * Check if username is available
 */
router.post('/validate-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const existing = isMongoReady()
      ? await User.findOne({ username: username.toLowerCase().trim() })
      : getMemoryUserByQuery({ username: username.toLowerCase().trim() });
    
    if (existing) {
      return res.json({ 
        isAvailable: false, 
        message: 'This username is already taken.' 
      });
    }

    res.json({ 
      isAvailable: true, 
      message: 'Username is available!' 
    });

  } catch (err) {
    console.error('Validation Error:', err);
    res.status(500).json({ message: 'Server error during validation.' });
  }
});

/**
 * POST /api/auth/validate-email
 * Check if email is available
 */
router.post('/validate-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        isValid: false,
        message: 'Invalid email format.' 
      });
    }

    const existing = isMongoReady()
      ? await User.findOne({ email: email.toLowerCase().trim() })
      : getMemoryUserByQuery({ email: email.toLowerCase().trim() });
    
    if (existing) {
      return res.json({ 
        isAvailable: false, 
        message: 'This email is already registered.' 
      });
    }

    res.json({ 
      isAvailable: true, 
      message: 'Email is available!' 
    });

  } catch (err) {
    console.error('Validation Error:', err);
    res.status(500).json({ message: 'Server error during validation.' });
  }
});

/**
 * POST /api/auth/validate-password
 * Check password strength
 */
router.post('/validate-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const result = validatePasswordStrength(password);
    
    res.json({
      isValid: result.isValid,
      strength: result.strength,
      details: result.details
    });

  } catch (err) {
    console.error('Validation Error:', err);
    res.status(500).json({ message: 'Server error during validation.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/users', async (req, res) => {
  try {
    await ensureSeedUsers();
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can create users.' });
    }

    const { userId: requestedUserId, name, email, mobileNumber, username, password, role, assignedPonds, profilePhoto, accountNotes, forcePasswordChange, isActive } = req.body;
    if (!name || !email || !username) {
      return res.status(400).json({ message: 'Name, email and username are required.' });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUserId = String(requestedUserId || '').trim();
    const cleanPassword = typeof password === 'string' ? password.trim() : '';
    const shouldForcePasswordChange = Boolean(forcePasswordChange);

    if (!isMongoReady()) {
      const existing = getMemoryUserByQuery({ username: normalizedUsername, email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ message: 'A user with that username or email already exists.' });
      }

      if (normalizedUserId) {
        const idExists = getMemoryUserByQuery({ userId: normalizedUserId });
        if (idExists) {
          return res.status(409).json({ message: 'A user with that ID already exists.' });
        }
      }

      let finalPasswordHash;
      let resetToken = null;
      let resetTokenExpiry = null;
      let forceReset = shouldForcePasswordChange;

      if (cleanPassword) {
        const passwordStrength = validatePasswordStrength(cleanPassword);
        if (!passwordStrength.isValid) {
          return res.status(400).json({ message: 'Password does not meet strength requirements.', requirements: passwordStrength.details });
        }
        finalPasswordHash = bcrypt.hashSync(cleanPassword, 8);
      } else {
        const tempPassword = crypto.randomBytes(8).toString('hex');
        finalPasswordHash = bcrypt.hashSync(tempPassword, 8);
        resetToken = crypto.randomBytes(32).toString('hex');
        resetTokenExpiry = new Date(Date.now() + 24 * 3600000);
        forceReset = true;
      }

      const userId = normalizedUserId || await generateUniqueUserId();
      const newUser = {
        _id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        ownerId: req.user.ownerId, // Inherit owner's workspace ID
        username: normalizedUsername,
        email: normalizedEmail,
        name: name.trim(),
        mobileNumber: mobileNumber || '',
        password: finalPasswordHash,
        role: String(role || 'servant').toLowerCase(),
        assignedPonds: Array.isArray(assignedPonds) ? assignedPonds : (assignedPonds ? String(assignedPonds).split(',').map(p => p.trim()).filter(Boolean) : []),
        profilePhoto: profilePhoto || '',
        accountNotes: accountNotes || '',
        forcePasswordChange: forceReset,
        resetToken,
        resetTokenExpiry,
        isActive: isActive !== false,
        isSuspended: false,
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      inMemoryUsers.unshift(newUser);
      if (resetToken) {
        console.log(`Invite/Reset link for ${normalizedEmail}: /reset-password?token=${resetToken}`);
      }
      res.status(201).json({ message: 'User created successfully.', user: sanitizeUser(newUser) });
      return;
    }

    const existing = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
    if (existing) {
      return res.status(409).json({ message: 'A user with that username or email already exists.' });
    }

    if (normalizedUserId) {
      const idExists = await User.findOne({ userId: normalizedUserId }).lean();
      if (idExists) {
        return res.status(409).json({ message: 'A user with that ID already exists.' });
      }
    }

    let finalPasswordHash;
    let resetToken = null;
    let resetTokenExpiry = null;
    let forceReset = shouldForcePasswordChange;

    if (cleanPassword) {
      const passwordStrength = validatePasswordStrength(cleanPassword);
      if (!passwordStrength.isValid) {
        return res.status(400).json({ message: 'Password does not meet strength requirements.', requirements: passwordStrength.details });
      }
      finalPasswordHash = bcrypt.hashSync(cleanPassword, 8);
    } else {
      const tempPassword = crypto.randomBytes(8).toString('hex');
      finalPasswordHash = bcrypt.hashSync(tempPassword, 8);
      resetToken = crypto.randomBytes(32).toString('hex');
      resetTokenExpiry = new Date(Date.now() + 24 * 3600000);
      forceReset = true;
    }

    const userId = normalizedUserId || await generateUniqueUserId();
    const newUser = new User({
      userId,
      ownerId: req.user.ownerId, // Inherit owner's workspace ID
      username: normalizedUsername,
      email: normalizedEmail,
      name: name.trim(),
      mobileNumber: mobileNumber || '',
      password: finalPasswordHash,
      role: String(role || 'servant').toLowerCase(),
      assignedPonds: Array.isArray(assignedPonds) ? assignedPonds : (assignedPonds ? String(assignedPonds).split(',').map(p => p.trim()).filter(Boolean) : []),
      profilePhoto: profilePhoto || '',
      accountNotes: accountNotes || '',
      forcePasswordChange: forceReset,
      resetToken,
      resetTokenExpiry,
      isActive: isActive !== false,
      isSuspended: false,
      registrationDate: new Date()
    });

    await newUser.save();
    if (resetToken) {
      console.log(`Invite/Reset link for ${normalizedEmail}: /reset-password?token=${resetToken}`);
    }
    const { password: _password, ...safeUser } = newUser.toObject();
    res.status(201).json({ message: 'User created successfully.', user: safeUser });
  } catch (err) {
    console.error('Create User Error:', err);
    res.status(500).json({ message: 'Server error while creating user.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    await ensureSeedUsers();
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can manage users.' });
    }

    if (!isMongoReady()) {
      const sanitizedUsers = inMemoryUsers.filter(u => u.ownerId === req.user.ownerId).map(user => sanitizeUser(user));
      return res.json(sanitizedUsers);
    }

    const users = await User.find({ ownerId: req.user.ownerId }).sort({ createdAt: -1 }).lean();
    const sanitizedUsers = users.map(({ password, ...rest }) => rest);
    res.json(sanitizedUsers);
  } catch (err) {
    console.error('List Users Error:', err);
    res.status(500).json({ message: 'Server error while listing users.' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    if (!isMongoReady()) {
      const targetUser = getMemoryUserById(req.params.id);
      if (!targetUser) return res.status(404).json({ message: 'User not found.' });

      if (targetUser.ownerId !== req.user.ownerId) {
        return res.status(403).json({ message: 'Access denied to this user\'s details.' });
      }

      if (!req.user || (!canManageUsers(req.user) && !canViewOwnProfile(req.user, targetUser._id.toString()))) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      return res.json(sanitizeUser(targetUser));
    }

    const targetUser = await User.findById(req.params.id).lean();
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    if (targetUser.ownerId !== req.user.ownerId) {
      return res.status(403).json({ message: 'Access denied to this user\'s details.' });
    }

    if (!req.user || (!canManageUsers(req.user) && !canViewOwnProfile(req.user, targetUser._id.toString()))) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { password, ...safeUser } = targetUser;
    res.json(safeUser);
  } catch (err) {
    console.error('Get User Error:', err);
    res.status(500).json({ message: 'Server error while loading user.' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can edit user details.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    if (targetUser.ownerId !== req.user.ownerId) {
      return res.status(403).json({ message: 'Access denied to edit this user.' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.userId;

    const previousValues = {};
    if (updates.password) {
      const passwordStrength = validatePasswordStrength(updates.password);
      if (!passwordStrength.isValid) {
        return res.status(400).json({ message: 'Password does not meet strength requirements.' });
      }
      targetUser.password = bcrypt.hashSync(updates.password, 8);
      targetUser.lastPasswordChange = new Date();
      targetUser.forcePasswordChange = Boolean(updates.forcePasswordChange ?? targetUser.forcePasswordChange);
      targetUser.pendingNotice = 'Your account information has been updated by the Owner.';
      targetUser.activityLog = targetUser.activityLog || [];
      targetUser.activityLog.push({
        action: 'password-reset',
        changedBy: req.user?.name || 'Owner',
        field: 'password',
        oldValue: '********',
        newValue: '********',
        createdAt: new Date(),
        ipAddress: req.ip || ''
      });
    }

    delete updates.password;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        previousValues[key] = targetUser[key];
        targetUser[key] = updates[key];
      }
    });

    if (updates.username) {
      const duplicate = await User.findOne({ username: updates.username.toLowerCase().trim(), _id: { $ne: targetUser._id } });
      if (duplicate) return res.status(409).json({ message: 'Username already taken.' });
      targetUser.username = updates.username.toLowerCase().trim();
    }

    if (updates.name || updates.mobileNumber || updates.username || updates.role || updates.assignedPonds || updates.profilePhoto || updates.accountNotes || updates.isActive !== undefined || updates.isSuspended !== undefined) {
      targetUser.pendingNotice = 'Your account information has been updated by the Owner.';
      targetUser.activityLog = targetUser.activityLog || [];
      targetUser.activityLog.push({
        action: 'updated-profile',
        changedBy: req.user?.name || 'Owner',
        field: 'profile',
        oldValue: previousValues,
        newValue: updates,
        createdAt: new Date(),
        ipAddress: req.ip || ''
      });
    }

    await targetUser.save();
    const { password, ...safeUser } = targetUser.toObject();
    res.json({ message: 'User updated successfully.', user: safeUser });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Server error while updating user.' });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can reset passwords.' });
    }

    const ownerRecord = await User.findById(req.user.id || req.user._id);
    if (!ownerRecord) return res.status(404).json({ message: 'Owner account not found.' });

    const { ownerPassword, newPassword, forceChange } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    const isOwnerMatch = bcrypt.compareSync(ownerPassword || '', ownerRecord.password || '');
    if (!isOwnerMatch) {
      return res.status(401).json({ message: 'Owner password confirmation failed.' });
    }

    const passwordStrength = validatePasswordStrength(newPassword || '');
    if (!passwordStrength.isValid) {
      return res.status(400).json({ message: 'Password does not meet strength requirements.' });
    }

    targetUser.password = bcrypt.hashSync(newPassword, 8);
    targetUser.forcePasswordChange = Boolean(forceChange);
    targetUser.lastPasswordChange = new Date();
    targetUser.passwordHistory = [...new Set([...(targetUser.passwordHistory || []), targetUser.password])];
    targetUser.pendingNotice = 'Your account information has been updated by the Owner.';
    targetUser.activityLog = targetUser.activityLog || [];
    targetUser.activityLog.push({
      action: 'password-reset',
      changedBy: ownerRecord.name || 'Owner',
      field: 'password',
      oldValue: '********',
      newValue: '********',
      createdAt: new Date(),
      ipAddress: req.ip || ''
    });
    await targetUser.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error while resetting password.' });
  }
});

router.post('/users/:id/status', async (req, res) => {
  try {
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can change user status.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    const { action } = req.body;
    const previousStatus = { isActive: targetUser.isActive, isSuspended: targetUser.isSuspended };
    if (action === 'activate') targetUser.isActive = true;
    if (action === 'deactivate') targetUser.isActive = false;
    if (action === 'suspend') targetUser.isSuspended = true;
    if (action === 'unsuspend') targetUser.isSuspended = false;

    targetUser.pendingNotice = 'Your account information has been updated by the Owner.';
    targetUser.activityLog = targetUser.activityLog || [];
    targetUser.activityLog.push({
      action: `status:${action}`,
      changedBy: req.user?.name || 'Owner',
      field: 'status',
      oldValue: previousStatus,
      newValue: { isActive: targetUser.isActive, isSuspended: targetUser.isSuspended },
      createdAt: new Date(),
      ipAddress: req.ip || ''
    });

    await targetUser.save();
    res.json({ message: 'User status updated.' });
  } catch (err) {
    console.error('Status Update Error:', err);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can delete users.' });
    }

    if (isMongoReady()) {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) return res.status(404).json({ message: 'User not found.' });

      // Prevent deleting users from another owner's workspace
      if (targetUser.ownerId !== req.user.ownerId) {
        return res.status(403).json({ message: 'Access denied. Cannot delete users from another workspace.' });
      }

      await targetUser.deleteOne();
    } else {
      // In-memory fallback
      const index = inMemoryUsers.findIndex(u => String(u._id) === req.params.id || u.userId === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'User not found.' });

      const targetUser = inMemoryUsers[index];
      if (targetUser.ownerId !== req.user.ownerId) {
        return res.status(403).json({ message: 'Access denied. Cannot delete users from another workspace.' });
      }

      inMemoryUsers.splice(index, 1);
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ message: 'Server error while deleting user.' });
  }

});

router.get('/user-activity', async (req, res) => {
  try {
    if (!req.user || !canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Only the owner can view activity logs.' });
    }

    // Filter by ownerId to show only this owner's users' activity
    const users = await User.find({ ownerId: req.user.ownerId }, { name: 1, userId: 1, activityLog: 1 }).lean();
    const activity = users.flatMap(user => (user.activityLog || []).map(entry => ({
      ...entry,
      userName: user.name,
      userId: user.userId
    })));

    activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(activity.slice(0, 100));
  } catch (err) {
    console.error('Activity Error:', err);
    res.status(500).json({ message: 'Server error while loading activity log.' });
  }
});


router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({ 
        message: 'If an account exists with this email, a reset link will be sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In production, send email with reset link
    console.log(`Reset link for ${email}: /reset-password?token=${resetToken}`);

    res.json({ 
      message: 'If an account exists with this email, a reset link will be sent.' 
    });

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error during password reset request.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet strength requirements.',
        requirements: passwordStrength.details
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = bcrypt.hashSync(newPassword, 8);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully!' });

  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (req, res) => {
  // Token is stored client-side, so just confirm logout
  res.json({ message: 'Logged out successfully.' });
});

// ==================== ADMIN ROUTES ====================

/**
 * Middleware: Verify user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    let users = [];
    
    if (isMongoReady()) {
      users = await User.find({}).select('-password').lean();
    } else {
      users = inMemoryUsers.map(u => {
        const { password, ...safeUser } = u;
        return safeUser;
      });
    }

    res.json({
      total: users.length,
      users: users
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ message: 'Failed to list users.' });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user details (admin only)
 */
router.get('/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user = null;
    if (isMongoReady()) {
      user = await User.findOne({
        $or: [{ userId }, { _id: userId }]
      }).select('-password').lean();
    } else {
      user = getMemoryUserById(userId);
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).json({ message: 'Failed to get user details.' });
  }
});

/**
 * POST /api/admin/users/search
 * Search users by name, email, or username (admin only)
 */
router.post('/admin/users/search', requireAdmin, async (req, res) => {
  try {
    const { query = '' } = req.body;
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    let users = [];
    if (isMongoReady()) {
      users = await User.find({
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { name: { $regex: searchTerm, $options: 'i' } },
          { userId: searchTerm }
        ]
      }).select('-password').lean();
    } else {
      users = inMemoryUsers.filter(u => {
        const uUsername = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        const uUserId = u.userId || '';
        return uUsername.includes(searchTerm) || 
               uEmail.includes(searchTerm) || 
               uName.includes(searchTerm) ||
               uUserId === searchTerm;
      }).map(u => {
        const { password, ...safeUser } = u;
        return safeUser;
      });
    }

    res.json({
      query: searchTerm,
      total: users.length,
      users: users
    });
  } catch (err) {
    console.error('Admin search users error:', err);
    res.status(500).json({ message: 'Failed to search users.' });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Change user role (admin only)
 * Body: { role: 'admin' | 'owner' | 'supervisor' | 'servant' }
 */
router.put('/admin/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'owner', 'supervisor', 'servant'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be one of: admin, owner, supervisor, servant.' 
      });
    }

    let user = null;
    if (isMongoReady()) {
      user = await User.findOne({
        $or: [{ userId }, { _id: userId }]
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      user.role = role;
      await user.save();
    } else {
      user = getMemoryUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      user.role = role;
    }

    const { password, ...safeUser } = user;
    res.json({
      message: `User role updated to ${role}.`,
      user: safeUser
    });
  } catch (err) {
    console.error('Admin update role error:', err);
    res.status(500).json({ message: 'Failed to update user role.' });
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Activate/deactivate user (admin only)
 * Body: { isActive: true | false }
 */
router.put('/admin/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value.' });
    }

    let user = null;
    if (isMongoReady()) {
      user = await User.findOne({
        $or: [{ userId }, { _id: userId }]
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      user.isActive = isActive;
      await user.save();
    } else {
      user = getMemoryUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      user.isActive = isActive;
    }

    const { password, ...safeUser } = user;
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'}.`,
      user: safeUser
    });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user (admin only)
 */
router.delete('/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (isMongoReady()) {
      const result = await User.deleteOne({
        $or: [{ userId }, { _id: userId }]
      });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
    } else {
      const index = inMemoryUsers.findIndex(u => 
        String(u._id) === String(userId) || u.userId === userId
      );
      if (index === -1) {
        return res.status(404).json({ message: 'User not found.' });
      }
      inMemoryUsers.splice(index, 1);
    }

    res.json({ 
      message: 'User deleted successfully.',
      deletedUserId: userId
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// ==================== DATA MIGRATION ====================

/**
 * POST /api/auth/migrate-owner-ids
 * One-time safe migration: backfill ownerId on existing records that don't have it.
 * Looks up each record's userId → finds that user → gets their ownerId → updates the record.
 * Safe to run multiple times (only updates records where ownerId is null/empty).
 */
router.post('/migrate-owner-ids', async (req, res) => {
  if (!isMongoReady()) {
    return res.status(503).json({ message: 'Database not connected. Migration requires MongoDB.' });
  }

  // Require the request to come from an authenticated owner or admin
  if (!req.user || (req.user.role !== 'owner' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Only owners or admins can run data migration.' });
  }

  try {
    const Pond = require('../models/Pond');
    const FeedLog = require('../models/FeedLog');
    const WaterLog = require('../models/WaterLog');
    const GrowthLog = require('../models/GrowthLog');
    const MortalityLog = require('../models/MortalityLog');
    const Expense = require('../models/Expense');
    const FeedInventory = require('../models/FeedInventory');
    const OperationalLog = require('../models/OperationalLog');
    const ShrimpCountLog = require('../models/ShrimpCountLog');
    const PondInvestment = require('../models/PondInvestment');

    const results = {};

    // Build a userId → ownerId lookup map from all users
    const allUsers = await User.find({}, { userId: 1, ownerId: 1, role: 1 }).lean();
    const userOwnerMap = {};
    for (const u of allUsers) {
      if (u.userId) {
        // For owners: ownerId = their own userId
        userOwnerMap[u.userId] = u.ownerId || (u.role === 'owner' ? u.userId : null);
      }
    }

    // Helper: migrate a collection's records where ownerId is missing
    async function migrateCollection(Model, name) {
      const records = await Model.find({ $or: [{ ownerId: null }, { ownerId: '' }, { ownerId: { $exists: false } }] }).lean();
      let updated = 0;
      let skipped = 0;

      for (const record of records) {
        const resolvedOwnerId = userOwnerMap[record.userId];
        if (resolvedOwnerId) {
          await Model.updateOne({ _id: record._id }, { $set: { ownerId: resolvedOwnerId } });
          updated++;
        } else {
          skipped++;
        }
      }
      results[name] = { found: records.length, updated, skipped };
    }

    await migrateCollection(Pond, 'Ponds');
    await migrateCollection(FeedLog, 'FeedLogs');
    await migrateCollection(WaterLog, 'WaterLogs');
    await migrateCollection(GrowthLog, 'GrowthLogs');
    await migrateCollection(MortalityLog, 'MortalityLogs');
    await migrateCollection(Expense, 'Expenses');
    await migrateCollection(FeedInventory, 'FeedInventory');
    await migrateCollection(OperationalLog, 'OperationalLogs');
    await migrateCollection(ShrimpCountLog, 'ShrimpCountLogs');
    await migrateCollection(PondInvestment, 'PondInvestments');

    console.log('✅ Data migration completed:', results);
    res.json({ message: 'Migration completed successfully.', results });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ message: 'Migration failed.', error: err.message });
  }
});

module.exports = router;
