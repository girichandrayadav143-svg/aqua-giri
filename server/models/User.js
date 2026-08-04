const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Core Authentication Fields
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  
  // Profile Information
  name: { type: String, required: true, trim: true },
  mobileNumber: { type: String, default: '' },
  
  // Role & Permissions
  role: { type: String, enum: ['owner', 'supervisor', 'servant'], default: 'servant' },
  
  // Timestamps
  registrationDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  forcePasswordChange: { type: Boolean, default: false },
  profilePhoto: { type: String, default: '' },
  assignedPonds: [{ type: String, default: [] }],
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  lastPasswordChange: { type: Date, default: null },
  passwordHistory: [{ type: String, default: [] }],
  accountNotes: { type: String, default: '' },
  pendingNotice: { type: String, default: '' },
  activityLog: [{
    action: String,
    changedBy: String,
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
    ipAddress: String
  }]
}, { timestamps: true });

// Index for faster queries
userSchema.index({ email: 1, username: 1, userId: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
