const express = require('express');
const router = express.Router();
const Pond = require('../models/Pond');
const FeedLog = require('../models/FeedLog');
const WaterLog = require('../models/WaterLog');
const GrowthLog = require('../models/GrowthLog');
const MortalityLog = require('../models/MortalityLog');
const OperationalLog = require('../models/OperationalLog');
const FeedInventory = require('../models/FeedInventory');
const ShrimpCountLog = require('../models/ShrimpCountLog');
const { canAccessPond, getAccessiblePondIds, canEditPond, canDeletePond } = require('../utils/roleAccess');

// Pre-seeded data fallback array for instant startup
let inMemoryPonds = [
  { id: "P001", pondId: "P001", name: "Pond 1", size: 5, stockingDate: "2026-05-15", doc: 67, status: "Active", supervisor: "Rajesh Kumar", servant: "Ramu", remarks: "High growth rate" },
  { id: "P002", pondId: "P002", name: "Pond 2", size: 5, stockingDate: "2026-05-20", doc: 62, status: "Active", supervisor: "Rajesh Kumar", servant: "Srinivas", remarks: "Normal aeration" },
  { id: "P003", pondId: "P003", name: "Pond 3", size: 5, stockingDate: "2026-06-01", doc: 50, status: "Active", supervisor: "Suresh Varma", servant: "Ramu", remarks: "Water exchange done" }
];

let inMemoryFeedLogs = [];
let inMemoryWaterLogs = [];
let inMemoryGrowthLogs = [];
let inMemoryMortalityLogs = [];
let inMemoryOperationalLogs = [];

async function findPondById(pid) {
  try {
    const dbPond = await Pond.findOne({ pondId: pid }) || await Pond.findOne({ id: pid });
    if (dbPond) return { pond: dbPond, source: 'db' };
  } catch (e) {}

  const memoryPond = inMemoryPonds.find(p => p.pondId === pid || p.id === pid) || null;
  return { pond: memoryPond, source: 'memory' };
}

async function persistPondUpdate(pid, updated) {
  try {
    const existing = await Pond.findOne({ pondId: pid }) || await Pond.findOne({ id: pid });
    if (existing) {
      await Pond.updateOne({ _id: existing._id }, { $set: updated });
    }
  } catch (e) {}

  const idx = inMemoryPonds.findIndex(p => p.pondId === pid || p.id === pid);
  const normalized = { ...updated, pondId: pid, id: pid };
  if (idx >= 0) {
    inMemoryPonds[idx] = normalized;
  } else {
    inMemoryPonds.push(normalized);
  }
  return normalized;
}

async function persistHistoryEntries(entries) {
  try {
    if (entries.length) {
      await OperationalLog.insertMany(entries);
    }
  } catch (e) {}
  inMemoryOperationalLogs.push(...entries);
}

async function getFeedInventoryState() {
  try {
    const inventory = await FeedInventory.findOne().sort({ createdAt: -1 });
    if (inventory) return inventory;
  } catch (e) {}

  return {
    totalStockKg: 10000,
    usedTodayKg: 0,
    remainingKg: 10000,
    updatedBy: 'Owner',
    updatedByRole: 'owner',
    updatedAt: new Date()
  };
}

async function saveFeedInventoryState(nextState) {
  try {
    const existing = await FeedInventory.findOne().sort({ createdAt: -1 });
    if (existing) {
      await FeedInventory.updateOne({ _id: existing._id }, { $set: nextState });
    } else {
      await new FeedInventory(nextState).save();
    }
  } catch (e) {}
}

// GET /api/ponds
router.get('/ponds', async (req, res) => {
  try {
    const dbPonds = await Pond.find();
    if (dbPonds.length) {
      const user = req.user || null;
      if (user) {
        const accessible = dbPonds.filter(pond => canAccessPond(user, pond));
        return res.json(accessible);
      }
      return res.json(dbPonds);
    }
  } catch(e) {}

  const user = req.user || null;
  const accessible = user ? inMemoryPonds.filter(pond => canAccessPond(user, pond)) : inMemoryPonds;
  res.json(accessible);
});

// POST /api/ponds
router.post('/ponds', async (req, res) => {
  try {
    const pondData = req.body;
    try {
      const newPond = new Pond(pondData);
      await newPond.save();
    } catch(e) {}
    
    const idx = inMemoryPonds.findIndex(p => p.pondId === pondData.pondId);
    if (idx >= 0) {
      inMemoryPonds[idx] = pondData;
    } else {
      inMemoryPonds.push(pondData);
    }
    res.json(pondData);
  } catch (err) {
    res.status(500).json({ message: 'Error saving pond.' });
  }
});

// DELETE /api/ponds/:pondId
router.delete('/ponds/:pondId', async (req, res) => {
  const pid = req.params.pondId;
  try {
    await Pond.deleteOne({ pondId: pid });
  } catch(e) {}
  inMemoryPonds = inMemoryPonds.filter(p => p.pondId !== pid && p.id !== pid);
  res.json({ success: true, message: `Pond ${pid} deleted.` });
});

// GET /api/feed-logs
router.get('/feed-logs', async (req, res) => {
  try {
    const logs = await FeedLog.find().sort({ createdAt: 1 });
    if (logs.length) return res.json(logs);
  } catch(e) {}
  res.json(inMemoryFeedLogs);
});

// GET /api/feed-inventory
router.get('/feed-inventory', async (req, res) => {
  const inventory = await getFeedInventoryState();
  res.json(inventory);
});

// POST /api/feed-inventory
router.post('/feed-inventory', async (req, res) => {
  const payload = {
    totalStockKg: Number(req.body?.totalStockKg ?? 0),
    usedTodayKg: Number(req.body?.usedTodayKg ?? 0),
    remainingKg: Number(req.body?.remainingKg ?? 0),
    updatedBy: req.body?.updatedBy || req.user?.name || 'Owner',
    updatedByRole: req.body?.updatedByRole || req.user?.role || 'owner',
    updatedAt: new Date(),
    remarks: req.body?.remarks || ''
  };

  await saveFeedInventoryState(payload);
  res.json(payload);
});

// POST /api/feed-logs
router.post('/feed-logs', async (req, res) => {
  const logObj = req.body;
  const payload = {
    ...logObj,
    date: logObj.date || new Date().toISOString().split('T')[0],
    timestamp: logObj.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date()
  };

  try {
    const pond = await Pond.findOne({ pondId: logObj.pondId }) || await Pond.findOne({ id: logObj.pondId });
    if (pond && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (pond && !canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }

    const newLog = new FeedLog(payload);
    await newLog.save();
    inMemoryFeedLogs.push(payload);

    const inventory = await getFeedInventoryState();
    const feedAmount = Number(payload.feedQtyKg || 0);
    const nextTotal = Number(inventory.totalStockKg || 0);
    const nextUsed = Number(inventory.usedTodayKg || 0) + feedAmount;
    const nextRemaining = Math.max(nextTotal - nextUsed, 0);
    const nextState = {
      totalStockKg: nextTotal,
      usedTodayKg: nextUsed,
      remainingKg: nextRemaining,
      updatedBy: req.user?.name || payload.servant || 'Owner',
      updatedByRole: req.user?.role || 'servant',
      updatedAt: new Date(),
      remarks: `Feed entered for ${payload.pondId}`
    };
    await saveFeedInventoryState(nextState);

    res.json({ ...payload, inventory: nextState });
  } catch(e) {
    res.status(500).json({ message: 'Unable to save feed log.' });
  }
});

// GET /api/water-logs
router.get('/water-logs', async (req, res) => {
  try {
    const logs = await WaterLog.find().sort({ createdAt: 1 });
    if (logs.length) return res.json(logs);
  } catch(e) {}
  res.json(inMemoryWaterLogs);
});

// POST /api/water-logs
router.post('/water-logs', async (req, res) => {
  const wqObj = req.body;
  const payload = {
    ...wqObj,
    date: wqObj.date || new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };
  try {
    const pond = await Pond.findOne({ pondId: wqObj.pondId }) || await Pond.findOne({ id: wqObj.pondId });
    if (pond && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (pond && !canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }
    const newWq = new WaterLog(payload);
    await newWq.save();
  } catch(e) {}
  inMemoryWaterLogs.push(payload);
  res.json(payload);
});

// GET /api/growth-logs
router.get('/growth-logs', async (req, res) => {
  try {
    const logs = await GrowthLog.find().sort({ createdAt: 1 });
    if (logs.length) return res.json(logs);
  } catch(e) {}
  res.json(inMemoryGrowthLogs);
});

// POST /api/growth-logs
router.post('/growth-logs', async (req, res) => {
  const grObj = req.body;
  const payload = {
    ...grObj,
    date: grObj.date || new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };
  try {
    const pond = await Pond.findOne({ pondId: grObj.pondId }) || await Pond.findOne({ id: grObj.pondId });
    if (pond && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (pond && !canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }
    const newGr = new GrowthLog(payload);
    await newGr.save();
  } catch(e) {}
  inMemoryGrowthLogs.push(payload);
  res.json(payload);
});

// GET /api/mortality-logs
router.get('/mortality-logs', async (req, res) => {
  try {
    const logs = await MortalityLog.find().sort({ createdAt: 1 });
    if (logs.length) return res.json(logs);
  } catch(e) {}
  res.json(inMemoryMortalityLogs);
});

// POST /api/mortality-logs
router.post('/mortality-logs', async (req, res) => {
  const mortObj = req.body;
  const payload = {
    ...mortObj,
    date: mortObj.date || new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };
  try {
    const pond = await Pond.findOne({ pondId: mortObj.pondId }) || await Pond.findOne({ id: mortObj.pondId });
    if (pond && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (pond && !canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }
    const newMort = new MortalityLog(payload);
    await newMort.save();
  } catch(e) {}
  inMemoryMortalityLogs.push(payload);
  res.json(payload);
});

router.post('/operational-log', async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: new Date() };
    let pond = null;

    if (payload.pondId) {
      try {
        pond = await Pond.findOne({ pondId: payload.pondId }) || await Pond.findOne({ id: payload.pondId });
      } catch (lookupErr) {
        pond = null;
      }
    }

    if (pond && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (pond && !canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }

    try {
      const log = new OperationalLog(payload);
      await log.save();
    } catch (saveErr) {
      // Fall back to in-memory persistence when Mongo validation or connectivity is unavailable.
    }

    inMemoryOperationalLogs.push(payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: 'Unable to save operational log.' });
  }
});

router.get('/operational-logs', async (req, res) => {
  try {
    const logs = await OperationalLog.find().sort({ createdAt: -1 });
    if (logs.length) return res.json(logs);
  } catch (e) {}
  res.json(inMemoryOperationalLogs);
});

router.get('/edit-history', async (req, res) => {
  try {
    const history = await OperationalLog.find({ type: 'edit-history' }).sort({ createdAt: -1 });
    if (history.length) return res.json(history);
  } catch (err) {}

  const fallbackHistory = inMemoryOperationalLogs
    .filter(item => item.type === 'edit-history')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(fallbackHistory);
});

router.get('/shrimp-count-history', async (req, res) => {
  try {
    const history = await ShrimpCountLog.find().sort({ createdAt: -1 });
    return res.json(history);
  } catch (err) {
    return res.json([]);
  }
});

router.post('/shrimp-count-history', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdAt: new Date()
    };
    const log = new ShrimpCountLog(payload);
    await log.save();
    return res.json(log);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to save shrimp count history.' });
  }
});

router.post('/edit-history', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      type: 'edit-history',
      createdAt: new Date()
    };
    const { pond } = await findPondById(payload.pondId);
    if (pond && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (pond && !canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }

    try {
      const log = new OperationalLog(payload);
      await log.save();
      return res.json(log);
    } catch (err) {
      inMemoryOperationalLogs.push(payload);
      return res.json(payload);
    }
  } catch (err) {
    res.status(500).json({ message: 'Unable to save edit history.' });
  }
});

router.post('/ponds/:pondId/update', async (req, res) => {
  try {
    const pid = req.params.pondId;
    const { pond } = await findPondById(pid);
    if (!pond) {
      return res.status(404).json({ message: 'Pond not found.' });
    }
    if (!canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }
    if (!canEditPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not permitted to edit this pond.' });
    }

    const changes = req.body?.changes || [];
    const updated = { ...(pond.toObject ? pond.toObject() : pond), ...req.body?.data, pondId: pid, id: pid };
    const persisted = await persistPondUpdate(pid, updated);

    const historyEntries = changes.map(change => ({
      type: 'edit-history',
      pondId: pid,
      pondName: persisted.name || pond.name,
      title: 'Pond field updated',
      fieldChanged: change.field,
      previousValue: change.previousValue,
      newValue: change.newValue,
      changedBy: req.body?.changedBy || req.user?.name || 'System',
      role: req.body?.role || req.user?.role || 'owner',
      description: `${change.field} updated`,
      createdAt: new Date()
    }));

    if (historyEntries.length) {
      await persistHistoryEntries(historyEntries);
    }

    res.json(persisted);
  } catch (err) {
    res.status(500).json({ message: 'Unable to update pond.' });
  }
});

router.post('/operational-log/:id/viewed', async (req, res) => {
  try {
    const log = await OperationalLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found.' });
    log.viewed = true;
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Unable to update notification.' });
  }
});

router.get('/history/:pondId', async (req, res) => {
  const { pondId } = req.params;
  const { range = 'today', startDate, endDate } = req.query;

  try {
    const pond = await Pond.findOne({ pondId }) || await Pond.findOne({ id: pondId });
    if (pond && req.user && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }

    const feedLogs = await FeedLog.find({ pondId }).lean();
    const waterLogs = await WaterLog.find({ pondId }).lean();
    const growthLogs = await GrowthLog.find({ pondId }).lean();
    const mortalityLogs = await MortalityLog.find({ pondId }).lean();

    const filterByDate = (items) => {
      const normalized = items.filter(item => item.date);
      if (range === 'custom' && startDate && endDate) {
        return normalized.filter(item => item.date >= startDate && item.date <= endDate);
      }
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      const last7 = new Date(now.getTime() - 6 * 86400000).toISOString().split('T')[0];
      const last30 = new Date(now.getTime() - 29 * 86400000).toISOString().split('T')[0];

      if (range === 'yesterday') return normalized.filter(item => item.date === yesterday);
      if (range === 'week') return normalized.filter(item => item.date >= last7 && item.date <= today);
      if (range === 'month') return normalized.filter(item => item.date >= last30 && item.date <= today);
      return normalized.filter(item => item.date === today);
    };

    res.json({
      pondId,
      range,
      feedLogs: filterByDate(feedLogs),
      waterLogs: filterByDate(waterLogs),
      growthLogs: filterByDate(growthLogs),
      mortalityLogs: filterByDate(mortalityLogs)
    });
  } catch (err) {
    res.status(500).json({ message: 'Unable to load history.' });
  }
});

module.exports = router;
