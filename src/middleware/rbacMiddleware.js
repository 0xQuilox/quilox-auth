/**
 * @file rbacMiddleware.js
 * @description A well-documented Express.js middleware for Role-Based Access Control (RBAC).
 * This middleware allows you to protect routes based on a user's role and the specific permissions
 * associated with that role.
 *
 * This version of the file has been refactored to act as a reusable module,
 * exporting the `rbacMiddleware` function for use in other files like `userRoutes.js`.
 */

// =========================================================================
// 1. Centralized Permissions Definition
// =========================================================================
// This object maps each role to an array of specific permissions.
const permissions = {
  admin: [
    'create:user', 'read:user', 'update:user', 'delete:user',
    'create:post', 'read:post', 'update:post', 'delete:post',
    'view:dashboard',
    'manage:all'
  ],
  editor: [
    'create:post', 'read:post', 'update:post',
    'view:own:stats',
  ],
  viewer: [
    'read:post'
  ],
};

// =========================================================================
// 2. The Core RBAC Middleware Function
// =========================================================================
/**
 * @function rbacMiddleware
 * @param {string[]} requiredPermissions - An array of permissions required to access the route.
 * @returns {function} An Express.js middleware function.
 * @description A higher-order function that returns the actual middleware.
 */
function rbacMiddleware(requiredPermissions) {
  // Return the middleware function itself.
  return (req, res, next) => {
    // Check if the user is authenticated. This middleware should run after your auth middleware.
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = req.user.role;
    const userPermissions = permissions[userRole];

    // Check if the user's role has any permissions defined.
    if (!userPermissions) {
      return res.status(403).json({ error: 'Your role does not have any permissions defined.' });
    }

    // Check if the user has a special "manage:all" permission for all access.
    if (userPermissions.includes('manage:all')) {
      return next();
    }

    // Check if the user has all the required permissions for this route.
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    // If the user has the necessary permissions, proceed to the next middleware/route handler.
    if (hasRequiredPermissions) {
      return next();
    } else {
      // If the user lacks the required permissions, send a 403 Forbidden error.
      return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
    }
  };
}

// =========================================================================
// 3. Export the Middleware
// =========================================================================

/**
 * @exports {function} The rbacMiddleware function.
 * This is the crucial line that makes the function available for other files to use.
 */
module.exports = rbacMiddleware;