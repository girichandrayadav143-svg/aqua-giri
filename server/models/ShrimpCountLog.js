const mongoose = require('mongoose');

const shrimpCountLogSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  pondName: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, default: '' },
  userName: { type: String, default: '' },
  userRole: { type: String, default: '' },
  previousCount: { type: Number, default: 0 },
  updatedCount: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.ShrimpCountLog || mongoose.model('ShrimpCountLog', shrimpCountLogSchema);
