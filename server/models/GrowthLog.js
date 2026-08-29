const mongoose = require('mongoose');

const growthLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  pondId: { type: String, required: true },

  doc: { type: Number, required: true },
  abw: { type: Number, required: true },
  weeklyGrowth: { type: Number, default: 2.0 },
  survivalRate: { type: Number, default: 85 },
  calculatedBiomassKg: { type: Number },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.GrowthLog || mongoose.model('GrowthLog', growthLogSchema);
