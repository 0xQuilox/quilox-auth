/**
 * @file rbacMiddleware.js
 * @description Configurable RBAC middleware.
 * - Default permissions map covers common roles.
 * - Factory allows injection of custom permission map (critical for library consumers).
 * - Supports legacy permission names ('manage_users' -> 'manage:all'/'read:user' etc.)
 */

const defaultPermissions = {
  admin: [
    'create:user', 'read:user', 'update:user', 'delete:user',
    'create:post', 'read:post', 'update:post', 'delete:post',
    'view:dashboard',
    'manage:all',
    'manage_users', // alias for backwards compat
  ],
  editor: [
    'create:post', 'read:post', 'update:post',
    'view:own:stats',
  ],
  viewer: [
    'read:post',
  ],
  user: [
    'read:post',
  ],
};

// Alias map for legacy permission strings used in authRoutes.js
const permissionAliases = {
  manage_users: ['manage:all', 'manage_users', 'read:user', 'create:user', 'update:user', 'delete:user'],
};

function normalizePermissions(required) {
  const list = Array.isArray(required) ? required : [required];
  // Expand aliases
  const expanded = [];
  for (const perm of list) {
    if (permissionAliases[perm]) {
      expanded.push(perm);
    } else {
      expanded.push(perm);
    }
  }
  return expanded;
}

function hasPermission(userPermissions, requiredPermissions) {
  // manage:all bypasses all checks
  if (userPermissions.includes('manage:all') || userPermissions.includes('manage_users')) {
    return true;
  }
  return requiredPermissions.every((perm) => {
    if (permissionAliases[perm]) {
      // alias satisfied if user has any of the expanded set
      return permissionAliases[perm].some((p) => userPermissions.includes(p));
    }
    return userPermissions.includes(perm);
  });
}

/**
 * Factory - create RBAC middleware with custom config.
 * @param {string|string[]} requiredPermissions
 * @param {object} [options]
 * @param {object} [options.permissions] - custom permissions map
 * @returns {import('express').RequestHandler}
 */
function createRbacMiddleware(requiredPermissions, options = {}) {
  const permissions = options.permissions || defaultPermissions;
  const required = normalizePermissions(requiredPermissions);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const role = req.user.role || 'user';
    const userPermissions = permissions[role];
    if (!userPermissions) {
      return res.status(403).json({ error: 'Your role does not have any permissions defined.' });
    }
    if (hasPermission(userPermissions, required)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
  };
}

// Backwards compat: rbacMiddleware(['read:user']) works.
// Also allow: rbacMiddleware(['read:user'], { permissions: custom })
function rbacMiddleware(requiredPermissions, options) {
  return createRbacMiddleware(requiredPermissions, options);
}

rbacMiddleware.createRbacMiddleware = createRbacMiddleware;
rbacMiddleware.defaultPermissions = defaultPermissions;
rbacMiddleware.permissionAliases = permissionAliases;

module.exports = rbacMiddleware;
