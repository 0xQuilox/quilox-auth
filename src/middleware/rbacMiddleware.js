/**
 * @file rbacMiddleware.js
 * @description An extensive and well-documented Express.js middleware for Role-Based Access Control (RBAC).
 * This middleware allows you to protect routes based on a user's role and the specific permissions associated with that role.
 *
 * Key features:
 * - Centralized permissions definition for easy management.
 * - Reusable `rbac` middleware function.
 * - Clear and informative error handling (403 Forbidden).
 * - Complete, runnable example to demonstrate usage.
 *
 * NOTE: This middleware assumes you have an authentication middleware that populates `req.user` with
 * a user object, including their role (e.g., `req.user.role`). This is a common pattern with JWT or session-based auth.
 */

const express = require('express');
const app = express();
const port = 3000;

// =========================================================================
// 1. Centralized Permissions Definition
// =========================================================================
// This object maps each role to an array of specific permissions.
// By centralizing this, you can easily manage and view all permissions in one place.
// The permissions strings should be descriptive and consistent.
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
 * @description A higher-order function that returns the actual middleware. This pattern
 * allows you to pass arguments (requiredPermissions) to the middleware factory.
 */
function rbacMiddleware(requiredPermissions) {
  return (req, res, next) => {
    // Check if the user is authenticated. This middleware should run after your auth middleware.
    if (!req.user) {
      // If no user is found, it's an authentication issue.
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
// 3. Example Usage with Express Routes
// =========================================================================

// This is a placeholder for your actual authentication middleware.
// In a real application, this would verify a token (JWT) or a session
// and attach the user object to `req.user`.
app.use((req, res, next) => {
  // Simulate a user based on a header for this example.
  // In a real app, this would come from a database query after auth.
  const userHeader = req.headers['x-user-role'];
  if (userHeader === 'admin') {
    req.user = { id: 1, role: 'admin', name: 'Admin User' };
  } else if (userHeader === 'editor') {
    req.user = { id: 2, role: 'editor', name: 'Editor User' };
  } else if (userHeader === 'viewer') {
    req.user = { id: 3, role: 'viewer', name: 'Viewer User' };
  } else {
    req.user = null;
  }
  next();
});

// --- User Routes (Admin-only) ---
// To access these routes, the user must have 'create:user', 'read:user', etc.
app.post('/users', rbacMiddleware(['create:user']), (req, res) => {
  res.status(201).json({ message: 'User created successfully.' });
});

app.get('/users/:id', rbacMiddleware(['read:user']), (req, res) => {
  res.status(200).json({ message: `User with id ${req.params.id} fetched.` });
});

app.put('/users/:id', rbacMiddleware(['update:user']), (req, res) => {
  res.status(200).json({ message: `User with id ${req.params.id} updated.` });
});

app.delete('/users/:id', rbacMiddleware(['delete:user']), (req, res) => {
  res.status(200).json({ message: `User with id ${req.params.id} deleted.` });
});

// --- Post Routes (Accessible by Admin and Editor) ---
app.post('/posts', rbacMiddleware(['create:post']), (req, res) => {
  res.status(201).json({ message: 'Post created successfully.' });
});

app.get('/posts/:id', rbacMiddleware(['read:post']), (req, res) => {
  res.status(200).json({ message: `Post with id ${req.params.id} fetched.` });
});

app.put('/posts/:id', rbacMiddleware(['update:post']), (req, res) => {
  res.status(200).json({ message: `Post with id ${req.params.id} updated.` });
});

// --- Viewers can only read posts ---
app.get('/posts', rbacMiddleware(['read:post']), (req, res) => {
  res.status(200).json({ message: 'List of all posts retrieved.' });
});

// --- Unprotected Route ---
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the API. This route is public.' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log('--- To test the routes, use a tool like Postman or curl. ---');
  console.log('Example curl commands:');
  console.log('\n✅ Admin (full access):');
  console.log(`curl -H "x-user-role: admin" http://localhost:${port}/users/1`);
  console.log('\n❌ Editor (read:user permission missing):');
  console.log(`curl -H "x-user-role: editor" http://localhost:${port}/users/1`);
  console.log('\n✅ Editor (has read:post permission):');
  console.log(`curl -H "x-user-role: editor" http://localhost:${port}/posts/1`);
  console.log('\n❌ Viewer (delete:post permission missing):');
  console.log(`curl -H "x-user-role: viewer" -X DELETE http://localhost:${port}/posts/1`);
});
