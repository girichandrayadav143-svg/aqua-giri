const mongoose = require('mongoose');

const feedInventorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  totalStockKg: { type: Number, default: 10000 },

  usedTodayKg: { type: Number, default: 0 },
  remainingKg: { type: Number, default: 10000 },
  updatedBy: { type: String, default: 'Owner' },
  updatedByRole: { type: String, default: 'owner' },
  updatedAt: { type: Date, default: Date.now },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.models.FeedInventory || mongoose.model('FeedInventory', feedInventorySchema);
