const mongoose = require('mongoose');

const pondSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  pondId: { type: String, required: true },

  name: { type: String, required: true },
  size: { type: Number, required: true, default: 5 },
  stockingDate: { type: String, required: true },
  doc: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Harvested', 'Empty'], default: 'Active' },
  supervisor: { type: String, default: 'Rajesh Kumar' },
  servant: { type: String, default: 'Ramu' },
  remarks: { type: String, default: '' },
  initialStock: { type: Number, default: 450000 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Pond || mongoose.model('Pond', pondSchema);
