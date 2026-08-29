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

// Default owner ID for seed / demo data
const DEFAULT_OWNER_ID = 'A7#d2!';

// Pre-seeded data fallback array — tagged to the default owner so other owners start clean
let inMemoryPonds = [
  { id: "P001", pondId: "P001", userId: DEFAULT_OWNER_ID, ownerId: DEFAULT_OWNER_ID, name: "Pond 1", size: 5, stockingDate: "2026-05-15", doc: 67, status: "Active", supervisor: "Rajesh Kumar", servant: "Ramu", remarks: "High growth rate" },
  { id: "P002", pondId: "P002", userId: DEFAULT_OWNER_ID, ownerId: DEFAULT_OWNER_ID, name: "Pond 2", size: 5, stockingDate: "2026-05-20", doc: 62, status: "Active", supervisor: "Rajesh Kumar", servant: "Srinivas", remarks: "Normal aeration" },
  { id: "P003", pondId: "P003", userId: DEFAULT_OWNER_ID, ownerId: DEFAULT_OWNER_ID, name: "Pond 3", size: 5, stockingDate: "2026-06-01", doc: 50, status: "Active", supervisor: "Suresh Varma", servant: "Ramu", remarks: "Water exchange done" }
];

let inMemoryFeedLogs = [];
let inMemoryWaterLogs = [];
let inMemoryGrowthLogs = [];
let inMemoryMortalityLogs = [];
let inMemoryOperationalLogs = [];
let inMemoryShrimpCountLogs = [];

// ==================== HELPERS ====================

/**
 * Returns the ownerId for the authenticated user.
 * For owners: ownerId === their own userId.
 * For supervisors/servants: ownerId === their owner's userId (stored in their User doc).
 */
function getOwnerIdFromUser(user) {
  return user?.ownerId || user?.userId;
}

/**
 * Find a pond by pondId, enforcing ownerId so cross-owner access is impossible.
 */
async function findPondById(pid, ownerId) {
  try {
    const query = ownerId
      ? { $or: [{ pondId: pid }, { id: pid }], ownerId }
      : { $or: [{ pondId: pid }, { id: pid }] };
    const dbPond = await Pond.findOne(query);
    if (dbPond) return { pond: dbPond, source: 'db' };
  } catch (e) {}

  const memoryPond = inMemoryPonds.find(p =>
    (p.pondId === pid || p.id === pid) &&
    (!ownerId || p.ownerId === ownerId)
  ) || null;
  return { pond: memoryPond, source: 'memory' };
}

async function persistPondUpdate(pid, updated) {
  try {
    const existing = await Pond.findOne({ $or: [{ pondId: pid }, { id: pid }] });
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

/**
 * Filter ponds for servants and supervisors — only their assigned ponds.
 */
function filterPondsByRole(user, ponds) {
  const role = String(user?.role || '').toLowerCase();
  if (role === 'owner') return ponds;
  // For supervisors and servants: use roleAccess canAccessPond
  return ponds.filter(pond => canAccessPond(user, pond));
}

// ==================== POND ROUTES ====================

// GET /api/ponds — Returns only the authenticated user's owner's ponds
router.get('/ponds', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    // Fetch all ponds belonging to this owner
    let ponds = [];
    try {
      ponds = await Pond.find({ ownerId });
    } catch (e) {
      console.error('Pond fetch error:', e.message);
    }

    if (!ponds.length) {
      // Fallback to in-memory ponds for this owner
      ponds = inMemoryPonds.filter(p => p.ownerId === ownerId);
    }

    // Role-based filtering: servants and supervisors only see their assigned ponds
    const accessible = filterPondsByRole(req.user, ponds);
    return res.json(accessible);
  } catch (err) {
    console.error('GET /ponds error:', err);
    res.status(500).json({ message: 'Error loading ponds.' });
  }
});

// POST /api/ponds — Create pond for authenticated owner
router.post('/ponds', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only owners can create ponds.', code: 'FORBIDDEN_CREATE_POND' });
    }

    const ownerId = getOwnerIdFromUser(req.user);
    const pondData = {
      ...req.body,
      userId: req.user.userId,  // Who created it
      ownerId                   // Which owner's workspace it belongs to
    };

    try {
      const newPond = new Pond(pondData);
      await newPond.save();
      return res.status(201).json(newPond);
    } catch (dbErr) {
      console.warn('Pond DB save failed, using memory fallback:', dbErr.message);
    }

    // Fallback to in-memory
    const idx = inMemoryPonds.findIndex(p => p.pondId === pondData.pondId);
    if (idx >= 0) {
      inMemoryPonds[idx] = pondData;
    } else {
      inMemoryPonds.push(pondData);
    }
    res.status(201).json(pondData);
  } catch (err) {
    res.status(500).json({ message: 'Error saving pond.' });
  }
});

// DELETE /api/ponds/:pondId — Delete pond (only owner who owns it)
router.delete('/ponds/:pondId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only owners can delete ponds.', code: 'FORBIDDEN_DELETE_POND' });
    }

    const pid = req.params.pondId;
    const ownerId = getOwnerIdFromUser(req.user);

    // Find pond verifying ownerId
    let pond = null;
    try {
      pond = await Pond.findOne({ $or: [{ pondId: pid }, { id: pid }], ownerId });
    } catch (e) {}

    if (!pond) {
      pond = inMemoryPonds.find(p => (p.pondId === pid || p.id === pid) && p.ownerId === ownerId);
    }

    if (!pond) {
      return res.status(403).json({
        message: 'Pond not found or you do not have permission to delete it.',
        code: 'FORBIDDEN_DELETE'
      });
    }

    try {
      await Pond.deleteOne({ $or: [{ pondId: pid }, { id: pid }], ownerId });
    } catch (e) {}

    inMemoryPonds = inMemoryPonds.filter(p =>
      !((p.pondId === pid || p.id === pid) && p.ownerId === ownerId)
    );

    res.json({ success: true, message: `Pond ${pid} deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting pond.' });
  }
});

// ==================== FEED LOG ROUTES ====================

// GET /api/feed-logs — Returns this owner's feed logs
router.get('/feed-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let logs = await FeedLog.find({ ownerId }).sort({ createdAt: 1 });
    if (logs.length) {
      // Servants: filter to only their assigned ponds
      if (req.user.role === 'servant' || req.user.role === 'supervisor') {
        const pondList = await Pond.find({ ownerId });
        const accessibleIds = getAccessiblePondIds(req.user, pondList);
        logs = logs.filter(l => accessibleIds.includes(l.pondId));
      }
      return res.json(logs);
    }
  } catch (e) {}

  let userLogs = inMemoryFeedLogs.filter(log => log.ownerId === ownerId);
  if (req.user.role === 'servant' || req.user.role === 'supervisor') {
    const pondList = inMemoryPonds.filter(p => p.ownerId === ownerId);
    const accessibleIds = getAccessiblePondIds(req.user, pondList);
    userLogs = userLogs.filter(l => accessibleIds.includes(l.pondId));
  }
  res.json(userLogs);
});

// POST /api/feed-logs — Create feed log (servants log on owner's ponds they're assigned to)
router.post('/feed-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);
  const logObj = req.body;
  const payload = {
    ...logObj,
    userId: req.user.userId,
    ownerId,
    date: logObj.date || new Date().toISOString().split('T')[0],
    timestamp: logObj.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date()
  };

  try {
    // Verify the pond belongs to this owner
    const pond = await Pond.findOne({ $or: [{ pondId: logObj.pondId }, { id: logObj.pondId }], ownerId });
    if (!pond) {
      return res.status(403).json({ message: 'You are not authorized for this pond.', code: 'FORBIDDEN_POND' });
    }

    // For servants/supervisors: verify they're assigned to this pond
    if (req.user.role !== 'owner' && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not assigned to this pond.', code: 'FORBIDDEN_POND_ASSIGNMENT' });
    }

    const newLog = new FeedLog(payload);
    await newLog.save();
    inMemoryFeedLogs.push(payload);

    // Update feed inventory for this owner
    const inventory = await FeedInventory.findOne({ ownerId }).sort({ createdAt: -1 });
    const feedAmount = Number(payload.feedQtyKg || 0);
    const nextTotal = Number(inventory?.totalStockKg || 10000);
    const nextUsed = Number(inventory?.usedTodayKg || 0) + feedAmount;
    const nextRemaining = Math.max(nextTotal - nextUsed, 0);
    const nextState = {
      userId: req.user.userId,
      ownerId,
      totalStockKg: nextTotal,
      usedTodayKg: nextUsed,
      remainingKg: nextRemaining,
      updatedBy: req.user?.name || payload.servant || 'Owner',
      updatedByRole: req.user?.role || 'servant',
      updatedAt: new Date(),
      remarks: `Feed entered for ${payload.pondId}`
    };

    const existing = await FeedInventory.findOne({ ownerId }).sort({ createdAt: -1 });
    if (existing) {
      await FeedInventory.updateOne({ _id: existing._id }, { $set: nextState });
    } else {
      await new FeedInventory(nextState).save();
    }

    res.json({ ...payload, inventory: nextState });
  } catch (e) {
    console.error('Feed log error:', e.message);
    res.status(500).json({ message: 'Unable to save feed log.' });
  }
});

// ==================== FEED INVENTORY ROUTES ====================

// GET /api/feed-inventory — Returns this owner's feed inventory
router.get('/feed-inventory', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    const inventory = await FeedInventory.findOne({ ownerId }).sort({ createdAt: -1 });
    if (inventory) return res.json(inventory);
  } catch (e) {}

  return res.json({
    userId: req.user.userId,
    ownerId,
    totalStockKg: 10000,
    usedTodayKg: 0,
    remainingKg: 10000,
    updatedBy: 'Owner',
    updatedByRole: 'owner',
    updatedAt: new Date()
  });
});

// POST /api/feed-inventory — Update this owner's feed inventory
router.post('/feed-inventory', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);
  const payload = {
    userId: req.user.userId,
    ownerId,
    totalStockKg: Number(req.body?.totalStockKg ?? 0),
    usedTodayKg: Number(req.body?.usedTodayKg ?? 0),
    remainingKg: Number(req.body?.remainingKg ?? 0),
    updatedBy: req.body?.updatedBy || req.user?.name || 'Owner',
    updatedByRole: req.body?.updatedByRole || req.user?.role || 'owner',
    updatedAt: new Date(),
    remarks: req.body?.remarks || ''
  };

  try {
    const existing = await FeedInventory.findOne({ ownerId }).sort({ createdAt: -1 });
    if (existing) {
      await FeedInventory.updateOne({ _id: existing._id }, { $set: payload });
    } else {
      await new FeedInventory(payload).save();
    }
  } catch (e) {}

  res.json(payload);
});

// ==================== WATER LOG ROUTES ====================

// GET /api/water-logs — Returns this owner's water logs
router.get('/water-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let logs = await WaterLog.find({ ownerId }).sort({ createdAt: 1 });
    if (logs.length) {
      if (req.user.role === 'servant' || req.user.role === 'supervisor') {
        const pondList = await Pond.find({ ownerId });
        const accessibleIds = getAccessiblePondIds(req.user, pondList);
        logs = logs.filter(l => accessibleIds.includes(l.pondId));
      }
      return res.json(logs);
    }
  } catch (e) {}

  let userLogs = inMemoryWaterLogs.filter(log => log.ownerId === ownerId);
  if (req.user.role === 'servant' || req.user.role === 'supervisor') {
    const pondList = inMemoryPonds.filter(p => p.ownerId === ownerId);
    const accessibleIds = getAccessiblePondIds(req.user, pondList);
    userLogs = userLogs.filter(l => accessibleIds.includes(l.pondId));
  }
  res.json(userLogs);
});

// POST /api/water-logs — Create water log
router.post('/water-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);
  const wqObj = req.body;
  const payload = {
    ...wqObj,
    userId: req.user.userId,
    ownerId,
    date: wqObj.date || new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  try {
    const pond = await Pond.findOne({ $or: [{ pondId: wqObj.pondId }, { id: wqObj.pondId }], ownerId });
    if (!pond) {
      return res.status(403).json({ message: 'You are not authorized for this pond.', code: 'FORBIDDEN_POND' });
    }
    if (req.user.role !== 'owner' && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not assigned to this pond.', code: 'FORBIDDEN_POND_ASSIGNMENT' });
    }
    const newWq = new WaterLog(payload);
    await newWq.save();
  } catch (e) {}

  inMemoryWaterLogs.push(payload);
  res.json(payload);
});

// ==================== GROWTH LOG ROUTES ====================

// GET /api/growth-logs — Returns this owner's growth logs
router.get('/growth-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let logs = await GrowthLog.find({ ownerId }).sort({ createdAt: 1 });
    if (logs.length) {
      if (req.user.role === 'servant' || req.user.role === 'supervisor') {
        const pondList = await Pond.find({ ownerId });
        const accessibleIds = getAccessiblePondIds(req.user, pondList);
        logs = logs.filter(l => accessibleIds.includes(l.pondId));
      }
      return res.json(logs);
    }
  } catch (e) {}

  let userLogs = inMemoryGrowthLogs.filter(log => log.ownerId === ownerId);
  if (req.user.role === 'servant' || req.user.role === 'supervisor') {
    const pondList = inMemoryPonds.filter(p => p.ownerId === ownerId);
    const accessibleIds = getAccessiblePondIds(req.user, pondList);
    userLogs = userLogs.filter(l => accessibleIds.includes(l.pondId));
  }
  res.json(userLogs);
});

// POST /api/growth-logs — Create growth log
router.post('/growth-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);
  const grObj = req.body;
  const payload = {
    ...grObj,
    userId: req.user.userId,
    ownerId,
    date: grObj.date || new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  try {
    const pond = await Pond.findOne({ $or: [{ pondId: grObj.pondId }, { id: grObj.pondId }], ownerId });
    if (!pond) {
      return res.status(403).json({ message: 'You are not authorized for this pond.', code: 'FORBIDDEN_POND' });
    }
    if (req.user.role !== 'owner' && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not assigned to this pond.', code: 'FORBIDDEN_POND_ASSIGNMENT' });
    }
    const newGr = new GrowthLog(payload);
    await newGr.save();
  } catch (e) {}

  inMemoryGrowthLogs.push(payload);
  res.json(payload);
});

// ==================== MORTALITY LOG ROUTES ====================

// GET /api/mortality-logs — Returns this owner's mortality logs
router.get('/mortality-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);

  try {
    let logs = await MortalityLog.find({ ownerId }).sort({ createdAt: 1 });
    if (logs.length) {
      if (req.user.role === 'servant' || req.user.role === 'supervisor') {
        const pondList = await Pond.find({ ownerId });
        const accessibleIds = getAccessiblePondIds(req.user, pondList);
        logs = logs.filter(l => accessibleIds.includes(l.pondId));
      }
      return res.json(logs);
    }
  } catch (e) {}

  let userLogs = inMemoryMortalityLogs.filter(log => log.ownerId === ownerId);
  if (req.user.role === 'servant' || req.user.role === 'supervisor') {
    const pondList = inMemoryPonds.filter(p => p.ownerId === ownerId);
    const accessibleIds = getAccessiblePondIds(req.user, pondList);
    userLogs = userLogs.filter(l => accessibleIds.includes(l.pondId));
  }
  res.json(userLogs);
});

// POST /api/mortality-logs — Create mortality log
router.post('/mortality-logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
  }

  const ownerId = getOwnerIdFromUser(req.user);
  const mortObj = req.body;
  const payload = {
    ...mortObj,
    userId: req.user.userId,
    ownerId,
    date: mortObj.date || new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  try {
    const pond = await Pond.findOne({ $or: [{ pondId: mortObj.pondId }, { id: mortObj.pondId }], ownerId });
    if (!pond) {
      return res.status(403).json({ message: 'You are not authorized for this pond.', code: 'FORBIDDEN_POND' });
    }
    if (req.user.role !== 'owner' && !canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not assigned to this pond.', code: 'FORBIDDEN_POND_ASSIGNMENT' });
    }
    const newMort = new MortalityLog(payload);
    await newMort.save();
  } catch (e) {}

  inMemoryMortalityLogs.push(payload);
  res.json(payload);
});

// ==================== OPERATIONAL LOG ROUTES ====================

// POST /api/operational-log — Save operational log for authenticated owner
router.post('/operational-log', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);
    const payload = {
      ...req.body,
      userId: req.user.userId,
      ownerId,
      createdAt: new Date()
    };

    let pond = null;
    if (payload.pondId) {
      try {
        pond = await Pond.findOne({
          $or: [{ pondId: payload.pondId }, { id: payload.pondId }],
          ownerId
        });
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
      // Fall back to in-memory
    }

    inMemoryOperationalLogs.push(payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: 'Unable to save operational log.' });
  }
});

// GET /api/operational-logs — Returns this owner's operational logs only
router.get('/operational-logs', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    try {
      const logs = await OperationalLog.find({ ownerId }).sort({ createdAt: -1 });
      if (logs.length) return res.json(logs);
    } catch (e) {}

    res.json(inMemoryOperationalLogs.filter(l => l.ownerId === ownerId));
  } catch (err) {
    res.status(500).json({ message: 'Unable to load operational logs.' });
  }
});

// GET /api/edit-history — Returns this owner's edit history
router.get('/edit-history', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    try {
      const history = await OperationalLog.find({ ownerId, type: 'edit-history' }).sort({ createdAt: -1 });
      if (history.length) return res.json(history);
    } catch (err) {}

    const fallbackHistory = inMemoryOperationalLogs
      .filter(item => item.type === 'edit-history' && item.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(fallbackHistory);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load edit history.' });
  }
});

// POST /api/edit-history — Save edit history entry
router.post('/edit-history', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);
    const payload = {
      ...req.body,
      type: 'edit-history',
      userId: req.user.userId,
      ownerId,
      createdAt: new Date()
    };

    const { pond } = await findPondById(payload.pondId, ownerId);
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

// ==================== SHRIMP COUNT ROUTES ====================

// GET /api/shrimp-count-history — Returns this owner's shrimp count history
router.get('/shrimp-count-history', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    try {
      const history = await ShrimpCountLog.find({ ownerId }).sort({ createdAt: -1 });
      return res.json(history);
    } catch (err) {}

    return res.json(inMemoryShrimpCountLogs.filter(l => l.ownerId === ownerId));
  } catch (err) {
    return res.json([]);
  }
});

// POST /api/shrimp-count-history — Save shrimp count entry
router.post('/shrimp-count-history', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);
    const payload = {
      ...req.body,
      userId: req.user.userId,
      ownerId,
      createdAt: new Date()
    };

    const log = new ShrimpCountLog(payload);
    await log.save();
    inMemoryShrimpCountLogs.push(payload);
    return res.json(log);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to save shrimp count history.' });
  }
});

// ==================== POND UPDATE ROUTES ====================

// POST /api/ponds/:pondId/update — Update pond fields
router.post('/ponds/:pondId/update', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const pid = req.params.pondId;
    const ownerId = getOwnerIdFromUser(req.user);
    const { pond } = await findPondById(pid, ownerId);

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
      userId: req.user.userId,
      ownerId,
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

// POST /api/operational-log/:id/viewed — Mark notification as viewed
router.post('/operational-log/:id/viewed', async (req, res) => {
  try {
    const log = await OperationalLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found.' });

    // Verify ownership
    const ownerId = getOwnerIdFromUser(req.user);
    if (log.ownerId && log.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    log.viewed = true;
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Unable to update notification.' });
  }
});

// ==================== HISTORY ROUTE ====================

// GET /api/history/:pondId — Returns pond history for the owner's pond only
router.get('/history/:pondId', async (req, res) => {
  const { pondId } = req.params;
  const { range = 'today', startDate, endDate } = req.query;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.', code: 'NOT_AUTHENTICATED' });
    }

    const ownerId = getOwnerIdFromUser(req.user);

    // Verify the pond belongs to this owner
    const pond = await Pond.findOne({
      $or: [{ pondId }, { id: pondId }],
      ownerId
    });

    if (!pond) {
      return res.status(403).json({ message: 'Pond not found or access denied.' });
    }

    if (!canAccessPond(req.user, pond)) {
      return res.status(403).json({ message: 'You are not authorized for this pond.' });
    }

    const feedLogs = await FeedLog.find({ pondId, ownerId }).lean();
    const waterLogs = await WaterLog.find({ pondId, ownerId }).lean();
    const growthLogs = await GrowthLog.find({ pondId, ownerId }).lean();
    const mortalityLogs = await MortalityLog.find({ pondId, ownerId }).lean();

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
