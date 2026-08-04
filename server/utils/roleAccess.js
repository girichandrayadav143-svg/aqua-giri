function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getUserTokens(user) {
  return [user?.username, user?.name]
    .map(normalizeText)
    .filter(Boolean);
}

function matchesAssignedUser(user, pond) {
  const userTokens = getUserTokens(user);
  if (!userTokens.length) return false;

  const servantText = normalizeText(pond?.servant);
  const supervisorText = normalizeText(pond?.supervisor);
  const assignedServants = Array.isArray(pond?.assignedServants) ? pond.assignedServants : [];
  const assignedTokens = assignedServants
    .map(value => normalizeText(value))
    .filter(Boolean);

  return userTokens.some(token => {
    return servantText === token
      || servantText.includes(token)
      || supervisorText === token
      || supervisorText.includes(token)
      || assignedTokens.includes(token);
  });
}

function canAccessPond(user, pond) {
  if (!user || !pond) return false;
  const role = normalizeText(user.role);

  if (role === 'owner' || role === 'supervisor') {
    return true;
  }

  if (role !== 'servant') {
    return false;
  }

  return matchesAssignedUser(user, pond);
}

function getAccessiblePondIds(user, ponds) {
  return (ponds || []).filter(pond => canAccessPond(user, pond)).map(pond => pond.pondId || pond.id);
}

function canEditPond(user, pond) {
  if (!user || !pond) return false;
  const role = normalizeText(user.role);

  if (role === 'owner') return true;
  if (role === 'supervisor') return true;
  if (role !== 'servant') return false;

  return matchesAssignedUser(user, pond);
}

function canEditDashboardCards(user) {
  if (!user) return false;
  const role = normalizeText(user.role);
  return role === 'owner' || role === 'supervisor' || role === 'servant';
}

function canDeletePond(user, pond) {
  if (!user || !pond) return false;
  return normalizeText(user.role) === 'owner';
}

module.exports = { canAccessPond, getAccessiblePondIds, canEditPond, canDeletePond, canEditDashboardCards };
