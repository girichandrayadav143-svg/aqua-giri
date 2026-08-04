const mongoose = require('mongoose');

const operationalLogSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  pondId: { type: String, default: '' },
  pondName: { type: String, default: '' },
  servantName: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  emergencyType: { type: String, default: '' },
  photoData: { type: String, default: '' },
  totalStockKg: { type: Number, default: 0 },
  usedTodayKg: { type: Number, default: 0 },
  remainingKg: { type: Number, default: 0 },
  minimumLimitKg: { type: Number, default: 0 },
  totalSeedStock: { type: Number, default: 0 },
  usedSeedStock: { type: Number, default: 0 },
  remainingSeedStock: { type: Number, default: 0 },
  totalAerators: { type: Number, default: 0 },
  runningAerators: { type: Number, default: 0 },
  stoppedAerators: { type: Number, default: 0 },
  aeratorStatus: { type: String, default: 'ON' },
  runningHours: { type: Number, default: 0 },
  totalShrimpCount: { type: Number, default: 0 },
  currentEstimatedCount: { type: Number, default: 0 },
  mortalityCount: { type: Number, default: 0 },
  survivalPercentage: { type: Number, default: 0 },
  updateType: { type: String, default: '' },
  changedBy: { type: String, default: '' },
  role: { type: String, default: '' },
  previousValue: { type: String, default: '' },
  newValue: { type: String, default: '' },
  severity: { type: String, default: 'info' },
  viewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.OperationalLog || mongoose.model('OperationalLog', operationalLogSchema);
