function canManageUsers(user) {
  return String(user?.role || '').toLowerCase() === 'owner';
}

function canViewOwnProfile(user, targetUserId) {
  if (!user || !targetUserId) return false;
  if (String(user?.role || '').toLowerCase() === 'owner') return true;
  if (String(user?.role || '').toLowerCase() !== 'servant') return false;
  return String(user?.id || user?.userId || '') === String(targetUserId);
}

module.exports = { canManageUsers, canViewOwnProfile };
