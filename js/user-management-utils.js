(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.AQUA_USER_UTILS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function normalizeUserRecord(user, fallbackId) {
    const base = user || {};
    const uid = base.uid || base.id || fallbackId || `user_${Date.now()}`;
    const userId = base.userId || `U${String((base.id || '').replace(/\D/g, '') || '0').padStart(3, '0')}`;
    return {
      ...base,
      uid,
      userId,
      fullName: base.fullName || base.name || 'Unnamed User',
      mobile: base.mobile || '',
      email: base.email || '',
      username: base.username || '',
      role: base.role || 'servant',
      assignedPonds: Array.isArray(base.assignedPonds) ? base.assignedPonds : (base.assignedPonds ? String(base.assignedPonds).split(',').map(v => v.trim()).filter(Boolean) : []),
      status: base.status || 'active',
      passwordHash: base.passwordHash || '',
      requiresPasswordChange: Boolean(base.requiresPasswordChange),
      createdAt: base.createdAt || new Date().toISOString(),
      updatedAt: base.updatedAt || new Date().toISOString(),
      lastLogin: base.lastLogin || ''
    };
  }

  function hashPassword(password) {
    if (!password) return '';
    let hash = 0;
    for (let i = 0; i < password.length; i += 1) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash |= 0;
    }
    return `h${Math.abs(hash).toString(16)}`;
  }

  function generateUserId(existingUsers) {
    const numbers = (existingUsers || []).map(user => parseInt((user.userId || user.id || '').replace(/\D/g, ''), 10)).filter(value => !Number.isNaN(value));
    const maxNumber = numbers.length ? Math.max(...numbers) : 0;
    return `U${String(maxNumber + 1).padStart(3, '0')}`;
  }

  function filterUsers(users, filters) {
    const query = (filters?.query || '').toLowerCase();
    const role = (filters?.role || 'all').toLowerCase();
    const status = (filters?.status || 'all').toLowerCase();

    return (users || []).filter(user => {
      const record = normalizeUserRecord(user, user?.uid || user?.id);
      const searchText = [record.userId, record.fullName, record.mobile, record.email, record.username, record.role, (record.assignedPonds || []).join(','), record.status].join(' ').toLowerCase();
      const matchesQuery = !query || searchText.includes(query);
      const matchesRole = role === 'all' || record.role === role;
      const matchesStatus = status === 'all' || record.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }

  function getUserDisplayName(user) {
    const record = normalizeUserRecord(user, user?.uid || user?.id);
    return record.fullName || record.username || 'User';
  }

  return {
    normalizeUserRecord,
    hashPassword,
    generateUserId,
    filterUsers,
    getUserDisplayName
  };
});
