/**
 * Authorization Middleware
 * Verifies user has permission to access/modify resources
 */

/**
 * Check if user is owner (for farm-level operations)
 */
function isOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ 
      message: 'Owner access required.',
      code: 'FORBIDDEN_OWNER'
    });
  }

  next();
}

/**
 * Check if user is owner or supervisor
 */
function isOwnerOrSupervisor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'owner' && req.user.role !== 'supervisor') {
    return res.status(403).json({ 
      message: 'Owner or Supervisor access required.',
      code: 'FORBIDDEN_ACCESS'
    });
  }

  next();
}

/**
 * Verify that authenticated user owns the specified resource
 * Used to verify userId in params matches authenticated user
 */
function verifyResourceOwnership(resourceUserId, authenticatedUserId) {
  return String(resourceUserId) === String(authenticatedUserId);
}

/**
 * Middleware to verify user owns resource being accessed
 * Expects userId in req.params.userId
 */
function ownsResource(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  const requestedUserId = req.params.userId;
  
  // Allow admin to access any user's resources
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Regular users can only access their own resources
  if (!verifyResourceOwnership(requestedUserId, req.user.userId)) {
    return res.status(403).json({ 
      message: 'You do not have permission to access this resource.',
      code: 'FORBIDDEN_OWNERSHIP'
    });
  }

  next();
}

/**
 * Generic authorization check - just verify authentication exists
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  next();
}

module.exports = {
  isOwner,
  isOwnerOrSupervisor,
  verifyResourceOwnership,
  ownsResource,
  requireAuth
};
