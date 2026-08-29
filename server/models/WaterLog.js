const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  pondId: { type: String, required: true },

  date: { type: String, required: true },
  time: { type: String },
  ph: { type: Number, required: true },
  do: { type: Number, required: true },
  salinity: { type: Number, required: true },
  temperature: { type: Number, required: true },
  transparency: { type: Number, required: true },
  ammonia: { type: Number, default: 0 },
  nitrate: { type: Number, default: 0 },
  enteredBy: { type: String, default: 'Supervisor' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.WaterLog || mongoose.model('WaterLog', waterLogSchema);
