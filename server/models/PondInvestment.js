const mongoose = require('mongoose');

const pondInvestmentSchema = new mongoose.Schema({
  // Core references
  userId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  pondId: { type: String, required: true, index: true },
  
  // Investment details
  category: { 
    type: String, 
    required: true,
    enum: [
      'Feed Cost',
      'Seed Cost',
      'Medicine Cost',
      'Electricity / Power Bill',
      'Generator Diesel',
      'Labor Cost',
      'Pond Preparation',
      'Water Treatment',
      'Probiotics',
      'Chemicals',
      'Equipment',
      'Maintenance',
      'Aerator Maintenance',
      'Water Testing / Lab',
      'Transportation',
      'Harvesting',
      'Other'
    ]
  },
  
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  description: { type: String, default: '' },
  
  // Audit trail
  createdBy: { type: String, required: true }, // User ID
  createdByName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Soft delete support
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Index for efficient queries
pondInvestmentSchema.index({ ownerId: 1, userId: 1, pondId: 1, createdAt: -1 });
pondInvestmentSchema.index({ ownerId: 1, userId: 1, category: 1 });

module.exports = mongoose.models.PondInvestment || mongoose.model('PondInvestment', pondInvestmentSchema);
