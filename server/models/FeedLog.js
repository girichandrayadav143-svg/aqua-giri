const mongoose = require('mongoose');

const feedLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  pondId: { type: String, required: true },

  date: { type: String, required: true },
  slot: { type: String, required: true }, // 07:00 AM, 10:00 AM, 01:00 PM, 04:00 PM
  feedQtyKg: { type: Number, required: true },
  feedType: { type: String, default: 'Vannamei Grower #3' },
  servant: { type: String, required: true },
  timestamp: { type: String },
  checkTime: { type: String }, // 08:30 AM, 11:30 AM, 02:30 PM, 05:30 PM
  consumptionStatus: { type: String, default: '100% Consumed' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.FeedLog || mongoose.model('FeedLog', feedLogSchema);
