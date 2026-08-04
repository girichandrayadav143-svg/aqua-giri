const test = require('node:test');
const assert = require('node:assert/strict');
const { canManageUsers, canViewOwnProfile } = require('../utils/userAccess');

test('owner can manage all users', () => {
  const owner = { role: 'owner' };
  assert.equal(canManageUsers(owner), true);
});

test('supervisor cannot manage other users', () => {
  const supervisor = { role: 'supervisor' };
  assert.equal(canManageUsers(supervisor), false);
});

test('servant can view their own profile but not another user profile', () => {
  const servant = { role: 'servant', id: 'u1' };
  assert.equal(canViewOwnProfile(servant, 'u1'), true);
  assert.equal(canViewOwnProfile(servant, 'u2'), false);
});
