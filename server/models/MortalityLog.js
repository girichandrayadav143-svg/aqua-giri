const mongoose = require('mongoose');

const mortalityLogSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  date: { type: String, required: true },
  count: { type: Number, required: true },
  cause: { type: String, default: 'Normal / Shedding' },
  notes: { type: String, default: '' },
  enteredBy: { type: String, default: 'Servant' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.MortalityLog || mongoose.model('MortalityLog', mortalityLogSchema);
