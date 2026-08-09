const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

const inMemoryExpenses = [];

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function normalizeExpense(expense) {
  return {
    _id: expense._id || expense.expenseId || `expense_${Date.now()}`,
    expenseId: expense.expenseId || expense._id || `expense_${Date.now()}`,
    category: expense.category || 'Other Expenses',
    amount: Number(expense.amount || 0),
    date: expense.date || new Date().toISOString().split('T')[0],
    time: expense.time || new Date().toTimeString().slice(0,5),
    pondNumber: expense.pondNumber || 'All',
    description: expense.description || '',
    billPhoto: expense.billPhoto || '',
    status: expense.status || 'pending',
    submittedBy: expense.submittedBy || null,
    submittedByName: expense.submittedByName || 'Unknown',
    submittedByRole: expense.submittedByRole || 'servant',
    approvedBy: expense.approvedBy || null,
    approvedByName: expense.approvedByName || '',
    approvalNotes: expense.approvalNotes || '',
    source: expense.source || 'servant',
    createdAt: expense.createdAt || new Date().toISOString(),
    updatedAt: expense.updatedAt || new Date().toISOString()
  };
}

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 }).lean();
    if (expenses && expenses.length) {
      return res.json(expenses);
    }
  } catch (err) {
    console.error('Expense list error:', err.message || err);
  }
  res.json(inMemoryExpenses);
});

router.post('/', async (req, res) => {
  try {
    const expense = normalizeExpense(req.body);
    try {
      const saved = await new Expense(expense).save();
      return res.status(201).json(saved);
    } catch (err) {
      console.warn('Expense save warning (fallback to memory):', err.message || err);
    }

    inMemoryExpenses.unshift(expense);
    return res.status(201).json(expense);
  } catch (err) {
    console.error('Expense save error:', err.message || err);
    res.status(500).json({ message: 'Unable to save expense.' });
  }
});

router.delete('/:id', async (req, res) => {
  const expenseId = req.params.id;
  try {
    if (isMongoReady()) {
      await Expense.deleteOne({ $or: [{ _id: expenseId }, { expenseId }] });
    }
  } catch (err) {
    console.warn('Expense delete warning:', err.message || err);
  }
  const index = inMemoryExpenses.findIndex(exp => String(exp._id) === expenseId || exp.expenseId === expenseId);
  if (index !== -1) {
    inMemoryExpenses.splice(index, 1);
  }
  res.json({ success: true, message: 'Expense deleted if it existed.' });
});

module.exports = router;
