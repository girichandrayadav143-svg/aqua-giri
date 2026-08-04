const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessPond, canEditPond, canEditDashboardCards } = require('../utils/roleAccess');

test('owner can access any pond', () => {
  const user = { role: 'owner' };
  assert.equal(canAccessPond(user, { pondId: 'P001', servant: 'Ramu' }), true);
});

test('owner, supervisor and servant can edit dashboard cards', () => {
  assert.equal(canEditDashboardCards({ role: 'owner' }), true);
  assert.equal(canEditDashboardCards({ role: 'supervisor' }), true);
  assert.equal(canEditDashboardCards({ role: 'servant' }), true);
  assert.equal(canEditDashboardCards({ role: 'guest' }), false);
});

test('servant only sees assigned ponds', () => {
  const user = { role: 'servant', username: 'ramu', name: 'Ramu' };
  const ponds = [
    { pondId: 'P001', servant: 'Ramu' },
    { pondId: 'P002', servant: 'Srinivas' },
    { pondId: 'P003', supervisor: 'Rajesh Kumar' }
  ];

  assert.equal(canAccessPond(user, ponds[0]), true);
  assert.equal(canAccessPond(user, ponds[1]), false);
});

test('supervisor can edit operational data but servant cannot edit other ponds', () => {
  const supervisor = { role: 'supervisor', name: 'Rajesh Kumar' };
  const servant = { role: 'servant', username: 'ramu', name: 'Ramu' };
  const assignedPond = { pondId: 'P001', servant: 'Ramu' };
  const otherPond = { pondId: 'P002', servant: 'Srinivas' };

  assert.equal(canEditPond(supervisor, assignedPond), true);
  assert.equal(canEditPond(servant, assignedPond), true);
  assert.equal(canEditPond(servant, otherPond), false);
});
