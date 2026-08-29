const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

const inMemoryExpenses = [];

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

/**
 * Returns the ownerId for the authenticated user.
 * Owners: ownerId === their own userId.
 * Supervisors/Servants: ownerId === their owner's userId.
 */
function getOwnerIdFromUser(user) {
  return user?.ownerId || user?.userId;
}

function normalizeExpense(expense) {
  return {
    _id: expense._id || expense.expenseId || `expense_${Date.now()}`,
    expenseId: expense.expenseId || expense._id || `expense_${Date.now()}`,
    category: expense.category || 'Other Expenses',
    amount: Number(expense.amount || 0),
    date: expense.date || new Date().toISOString().split('T')[0],
    time: expense.time || new Date().toTimeString().slice(0, 5),
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

// GET / — Expenses for this owner only
router.get('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    const expenses = await Expense.find({ ownerId }).sort({ createdAt: -1 }).lean();
    if (expenses && expenses.length) {
      return res.json(expenses);
    }
  } catch (err) {
    console.error('Expense list error:', err.message || err);
  }

  const userExpenses = inMemoryExpenses.filter(exp => exp.ownerId === ownerId);
  res.json(userExpenses);
});

// POST / — Create expense (servants/supervisors can submit under their owner's workspace)
router.post('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    const expense = {
      ...normalizeExpense(req.body),
      userId: req.user.userId,   // Who submitted it
      ownerId                    // Which owner's workspace
    };

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

// DELETE /:id — Delete expense (only if it belongs to this owner)
router.delete('/:id', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);
  const expenseId = req.params.id;

  try {
    if (isMongoReady()) {
      const expense = await Expense.findOne({
        $or: [{ _id: expenseId }, { expenseId }],
        ownerId  // Enforce owner isolation
      });
      if (!expense) {
        return res.status(403).json({
          message: 'Expense not found or you do not have permission to delete it.',
          code: 'FORBIDDEN_DELETE'
        });
      }
      await Expense.deleteOne({ $or: [{ _id: expenseId }, { expenseId }], ownerId });
    }
  } catch (err) {
    console.warn('Expense delete warning:', err.message || err);
  }

  const index = inMemoryExpenses.findIndex(exp =>
    (String(exp._id) === expenseId || exp.expenseId === expenseId) && exp.ownerId === ownerId
  );
  if (index !== -1) {
    inMemoryExpenses.splice(index, 1);
  }
  res.json({ success: true, message: 'Expense deleted if it existed.' });
});

// ============== INVESTMENT SUMMARY ROUTES ==============

// GET /summary/investments — For this owner only
router.get('/summary/investments', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let allExpenses = [];
    try {
      const dbExpenses = await Expense.find({ ownerId }).lean();
      allExpenses = dbExpenses || [];
    } catch (err) {
      console.warn('DB expenses fetch warning:', err.message);
      allExpenses = inMemoryExpenses.filter(e => e.ownerId === ownerId);
    }

    if (!allExpenses.length) {
      allExpenses = inMemoryExpenses.filter(e => e.ownerId === ownerId);
    }

    const pondInvestments = {};
    let ownerInvestmentTotal = 0;
    let totalExpenses = 0;

    allExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      totalExpenses += amount;

      if (exp.investmentType === 'owner') {
        ownerInvestmentTotal += amount;
      } else if (exp.investmentType === 'pond' || !exp.investmentType) {
        const pond = exp.pondNumber || 'All';
        if (!pondInvestments[pond]) {
          pondInvestments[pond] = 0;
        }
        pondInvestments[pond] += amount;
      }
    });

    const pondTotalAmount = Object.values(pondInvestments).reduce((a, b) => a + b, 0);
    const totalFarmInvestment = pondTotalAmount + ownerInvestmentTotal;

    res.json({
      pondInvestments,
      pondInvestmentTotal: pondTotalAmount,
      ownerInvestmentTotal,
      totalFarmInvestment,
      totalExpenses
    });
  } catch (err) {
    console.error('Investment summary error:', err.message);
    res.status(500).json({ error: 'Failed to get investment summary' });
  }
});

// GET /pond/:pondId — Investment details for a specific pond (this owner only)
router.get('/pond/:pondId', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    const { pondId } = req.params;
    let allExpenses = [];
    try {
      const dbExpenses = await Expense.find({
        ownerId,
        $or: [{ pondNumber: pondId }, { linkedPond: pondId }]
      }).lean();
      allExpenses = dbExpenses || [];
    } catch (err) {
      console.warn('DB pond expenses fetch warning:', err.message);
      allExpenses = inMemoryExpenses.filter(e => e.ownerId === ownerId && e.pondNumber === pondId);
    }

    const categoryTotals = {};
    allExpenses.forEach(exp => {
      const category = exp.category || 'Other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += Number(exp.amount) || 0;
    });

    const totalPondInvestment = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    res.json({
      pond: pondId,
      categoryTotals,
      totalInvestment: totalPondInvestment,
      expenses: allExpenses
    });
  } catch (err) {
    console.error('Pond investment details error:', err.message);
    res.status(500).json({ error: 'Failed to get pond investment details' });
  }
});

// GET /recent/list — Recent investments for this owner
router.get('/recent/list', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let allExpenses = [];
    try {
      const dbExpenses = await Expense.find({ ownerId }).sort({ createdAt: -1 }).limit(50).lean();
      allExpenses = dbExpenses || [];
    } catch (err) {
      console.warn('DB recent expenses fetch warning:', err.message);
      allExpenses = inMemoryExpenses.filter(e => e.ownerId === ownerId).slice(0, 50);
    }

    if (!allExpenses.length) {
      allExpenses = inMemoryExpenses.filter(e => e.ownerId === ownerId).slice(0, 50);
    }

    res.json(allExpenses);
  } catch (err) {
    console.error('Recent investments error:', err.message);
    res.status(500).json({ error: 'Failed to get recent investments' });
  }
});

// GET /owner/total — Owner investment total for this owner
router.get('/owner/total', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let allExpenses = [];
    try {
      const dbExpenses = await Expense.find({ ownerId, investmentType: 'owner' }).lean();
      allExpenses = dbExpenses || [];
    } catch (err) {
      console.warn('DB owner expenses fetch warning:', err.message);
      allExpenses = inMemoryExpenses.filter(e => e.ownerId === ownerId && e.investmentType === 'owner');
    }

    const ownerTotal = allExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    res.json({
      investmentType: 'owner',
      totalInvestment: ownerTotal,
      count: allExpenses.length,
      expenses: allExpenses
    });
  } catch (err) {
    console.error('Owner investment total error:', err.message);
    res.status(500).json({ error: 'Failed to get owner investment total' });
  }
});

module.exports = router;
