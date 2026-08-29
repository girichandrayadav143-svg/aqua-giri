const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PondInvestment = require('../models/PondInvestment');
const Pond = require('../models/Pond');

// In-memory fallback
const inMemoryInvestments = [];

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

/**
 * Verify the pond belongs to the requesting user's owner workspace.
 * Uses ownerId (not userId) so supervisors/servants can also verify.
 */
async function verifyPondOwnership(ownerId, pondId) {
  if (!isMongoReady()) {
    return true; // In fallback mode, skip verification
  }
  const pond = await Pond.findOne({ ownerId, $or: [{ pondId }, { id: pondId }] }).lean();
  return !!pond;
}

/**
 * GET /api/pond-investments/:pondId
 * Get all investments for a specific pond (this owner's workspace only)
 */
router.get('/:pondId', async (req, res) => {
  try {
    const { pondId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    // Verify the pond belongs to this owner
    const ownsRow = await verifyPondOwnership(ownerId, pondId);
    if (!ownsRow && isMongoReady()) {
      return res.status(403).json({ message: 'Access denied to this pond.' });
    }

    // Try MongoDB first
    if (isMongoReady()) {
      const investments = await PondInvestment.find({
        ownerId,
        pondId,
        isDeleted: false
      }).sort({ date: -1 }).lean();

      return res.json({
        investments,
        source: 'mongodb'
      });
    }

    // Fallback to memory
    const investments = inMemoryInvestments.filter(
      inv => inv.ownerId === ownerId && inv.pondId === pondId && !inv.isDeleted
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      investments,
      source: 'memory'
    });
  } catch (err) {
    console.error('Error fetching pond investments:', err);
    res.status(500).json({ message: 'Failed to fetch investments.' });
  }
});

/**
 * GET /api/pond-investments/:pondId/summary
 * Get total investment and category breakdown for a pond (this owner only)
 */
router.get('/:pondId/summary', async (req, res) => {
  try {
    const { pondId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    const ownsRow = await verifyPondOwnership(ownerId, pondId);
    if (!ownsRow && isMongoReady()) {
      return res.status(403).json({ message: 'Access denied to this pond.' });
    }

    let investments = [];

    if (isMongoReady()) {
      investments = await PondInvestment.find({
        ownerId,
        pondId,
        isDeleted: false
      }).lean();
    } else {
      investments = inMemoryInvestments.filter(
        inv => inv.ownerId === ownerId && inv.pondId === pondId && !inv.isDeleted
      );
    }

    // Calculate total
    const totalAmount = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Calculate by category
    const categoryTotals = {};
    investments.forEach(inv => {
      const category = inv.category || 'Other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += inv.amount || 0;
    });

    res.json({
      pondId,
      totalAmount,
      investmentCount: investments.length,
      categoryTotals,
      categories: [
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
    });
  } catch (err) {
    console.error('Error fetching pond summary:', err);
    res.status(500).json({ message: 'Failed to fetch summary.' });
  }
});

/**
 * POST /api/pond-investments/:pondId
 * Add new investment for a pond (owner's workspace)
 */
router.post('/:pondId', async (req, res) => {
  try {
    const { pondId } = req.params;
    const { category, amount, date, description } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const ownerId = getOwnerIdFromUser(req.user);
    const userId = req.user.userId;
    const userName = req.user?.name || req.user?.username || 'Unknown';

    if (!category || amount === undefined || !date) {
      return res.status(400).json({ message: 'Category, amount, and date are required.' });
    }

    if (amount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    // Verify the pond belongs to this owner
    const ownsRow = await verifyPondOwnership(ownerId, pondId);
    if (!ownsRow && isMongoReady()) {
      return res.status(403).json({ message: 'Access denied to this pond.' });
    }

    const investmentData = {
      userId,
      ownerId,
      pondId,
      category: category.trim(),
      amount: Number(amount),
      date: new Date(date),
      description: (description || '').trim(),
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date(),
      isDeleted: false
    };

    if (isMongoReady()) {
      try {
        const investment = new PondInvestment(investmentData);
        const saved = await investment.save();
        return res.status(201).json({ success: true, investment: saved, source: 'mongodb' });
      } catch (dbErr) {
        console.warn('MongoDB save failed, using memory fallback:', dbErr.message);
      }
    }

    // Fallback to memory
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const investment = { _id: id, ...investmentData };
    inMemoryInvestments.push(investment);

    res.status(201).json({ success: true, investment, source: 'memory' });
  } catch (err) {
    console.error('Error creating investment:', err);
    res.status(500).json({ message: 'Failed to create investment.' });
  }
});

/**
 * PUT /api/pond-investments/:pondId/:investmentId
 * Update an investment (must belong to this owner)
 */
router.put('/:pondId/:investmentId', async (req, res) => {
  try {
    const { pondId, investmentId } = req.params;
    const { category, amount, date, description } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const ownerId = getOwnerIdFromUser(req.user);
    const userId = req.user.userId;

    if (!category || amount === undefined || !date) {
      return res.status(400).json({ message: 'Category, amount, and date are required.' });
    }

    if (amount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    // Verify the pond belongs to this owner
    const ownsRow = await verifyPondOwnership(ownerId, pondId);
    if (!ownsRow && isMongoReady()) {
      return res.status(403).json({ message: 'Access denied to this pond.' });
    }

    if (isMongoReady()) {
      const investment = await PondInvestment.findOne({
        _id: investmentId,
        ownerId,
        pondId,
        isDeleted: false
      });

      if (!investment) {
        return res.status(404).json({ message: 'Investment not found.' });
      }

      investment.category = category.trim();
      investment.amount = Number(amount);
      investment.date = new Date(date);
      investment.description = (description || '').trim();
      investment.updatedAt = new Date();

      const updated = await investment.save();
      return res.json({ success: true, investment: updated, source: 'mongodb' });
    }

    // Fallback to memory
    const index = inMemoryInvestments.findIndex(
      inv => String(inv._id) === investmentId &&
             inv.ownerId === ownerId &&
             inv.pondId === pondId &&
             !inv.isDeleted
    );

    if (index === -1) {
      return res.status(404).json({ message: 'Investment not found.' });
    }

    inMemoryInvestments[index] = {
      ...inMemoryInvestments[index],
      category: category.trim(),
      amount: Number(amount),
      date: new Date(date),
      description: (description || '').trim(),
      updatedAt: new Date()
    };

    res.json({ success: true, investment: inMemoryInvestments[index], source: 'memory' });
  } catch (err) {
    console.error('Error updating investment:', err);
    res.status(500).json({ message: 'Failed to update investment.' });
  }
});

/**
 * DELETE /api/pond-investments/:pondId/:investmentId
 * Delete an investment (soft delete, must belong to this owner)
 */
router.delete('/:pondId/:investmentId', async (req, res) => {
  try {
    const { pondId, investmentId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    // Verify the pond belongs to this owner
    const ownsRow = await verifyPondOwnership(ownerId, pondId);
    if (!ownsRow && isMongoReady()) {
      return res.status(403).json({ message: 'Access denied to this pond.' });
    }

    if (isMongoReady()) {
      const investment = await PondInvestment.findOne({
        _id: investmentId,
        ownerId,
        pondId,
        isDeleted: false
      });

      if (!investment) {
        return res.status(404).json({ message: 'Investment not found.' });
      }

      investment.isDeleted = true;
      investment.updatedAt = new Date();
      await investment.save();

      return res.json({ success: true, message: 'Investment deleted.', source: 'mongodb' });
    }

    // Fallback to memory
    const index = inMemoryInvestments.findIndex(
      inv => String(inv._id) === investmentId &&
             inv.ownerId === ownerId &&
             inv.pondId === pondId &&
             !inv.isDeleted
    );

    if (index === -1) {
      return res.status(404).json({ message: 'Investment not found.' });
    }

    inMemoryInvestments[index].isDeleted = true;
    inMemoryInvestments[index].updatedAt = new Date();

    res.json({ success: true, message: 'Investment deleted.', source: 'memory' });
  } catch (err) {
    console.error('Error deleting investment:', err);
    res.status(500).json({ message: 'Failed to delete investment.' });
  }
});

/**
 * GET /api/pond-investments/all/user-ponds
 * Get investment summary for all ponds in this owner's workspace
 */
router.get('/all/user-ponds', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    let ponds = [];

    if (isMongoReady()) {
      ponds = await Pond.find({ ownerId }).select('pondId name').lean();
    }

    const pondSummaries = {};
    let totalFarmInvestment = 0;

    for (const pond of ponds) {
      let investments = [];

      if (isMongoReady()) {
        investments = await PondInvestment.find({
          ownerId,
          pondId: pond.pondId,
          isDeleted: false
        }).lean();
      } else {
        investments = inMemoryInvestments.filter(
          inv => inv.ownerId === ownerId && inv.pondId === pond.pondId && !inv.isDeleted
        );
      }

      const totalAmount = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      totalFarmInvestment += totalAmount;

      pondSummaries[pond.pondId] = {
        pondId: pond.pondId,
        name: pond.name,
        totalAmount,
        investmentCount: investments.length
      };
    }

    res.json({
      pondSummaries,
      totalFarmInvestment,
      ponds: ponds.length
    });
  } catch (err) {
    console.error('Error fetching user pond summaries:', err);
    res.status(500).json({ message: 'Failed to fetch summaries.' });
  }
});

module.exports = router;
