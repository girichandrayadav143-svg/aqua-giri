const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: { type: String, enum: ['expense', 'investment', 'manual-investment'], default: 'expense' },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, default: 0 },
  date: { type: String, required: true },
  time: { type: String, default: '' },
  pondNumber: { type: String, default: 'All' },
  description: { type: String, default: '' },
  billPhoto: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: { type: String, default: '' },
  submittedByRole: { type: String, default: 'servant' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String, default: '' },
  approvalNotes: { type: String, default: '' },
  source: { type: String, default: 'servant' }
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
