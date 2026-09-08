# Quilox Auth 🔑 v2.0.0

Secure, configurable authentication & RBAC middleware for Express + Mongoose. Ships as a library (no app boilerplate in your bundle).

## What's New in v2
- **P0 fixes**: Broken `require()` paths, `bcrypt` vs `bcryptjs`, import side-effects / `process.exit` removed
- **Security**: `helmet`/`cors`/`morgan` wired, rate-limiting, `isActive` checks, refresh tokens
- **DX**: `exports`/`files`, `engines >=18`, `MIT` license, `TypeScript` types (`src/index.d.ts`), `jest` + `mongodb-memory-server`
- See [CHANGELOG.md](./CHANGELOG.md)

## Install
```bash
npm install quilox-auth
# peers: express ^4|^5, mongoose ^7|^8 (optional if you bring your own DB)
```

## Quickstart (as library)
```js
// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { authRoutes, errorHandler, notFound } = require('quilox-auth');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

await mongoose.connect(process.env.MONGO_URI);
app.listen(3000);
```

## Env (.env.example)
```
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=at_least_32_chars_random
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=separate_long_random
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=*
```

## API (mounted at /api/v1/auth)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | no + rate-limited | `{email,password,role?}` |
| POST | /login | no + rate-limited | `{email,password}` |
| POST | /refresh | no | `{refreshToken}` |
| GET | /profile | yes | self |
| PATCH | /profile | yes | `{email?}` |
| PATCH | /change-password | yes | `{currentPassword,newPassword,confirmPassword}` |
| GET | /users | admin | paginated `?page&limit` |
| GET | /users/:id | admin | |
| PATCH | /users/:id | admin | `{email?,role?,isActive?}` |
| DELETE | /users/:id | admin | |

Include `Authorization: Bearer <token>`.

## Importing Pieces
```js
const { authMiddleware, rbacMiddleware, jwtUtils, passwordUtils, validatorMiddleware } = require('quilox-auth');

// protect a route
app.get('/admin', authMiddleware, rbacMiddleware(['manage_users']), handler);

// custom RBAC map
const adminOnly = rbacMiddleware(['manage_users'], { permissions: { superadmin: ['manage:all'] } });

// tokens
const token = jwtUtils.generateToken({ id: user._id, role: user.role });
const payload = jwtUtils.verifyToken(token);
```

## Middleware
- `authMiddleware` / `authMiddleware.createAuthMiddleware({secret, header})` - case-insensitive `Bearer`
- `rbacMiddleware(['read:user'])` - `manage:all` bypass, alias `manage_users`, inject custom map
- `validate({body: schema})` - Joi, strips unknown
- `globalLimiter` / `authLimiter` - `express-rate-limit`

## Testing
```bash
npm test                # jest + mongodb-memory-server
npm run lint
```

## Project Structure
```
src/
  config/        # env validation
  middleware/    # auth, rbac, validator, rateLimit, error
  utils/         # jwt, password
  models/        # User (mongoose)
  api/routes/    # authRoutes (canonical)
  index.js       # public entry
  index.d.ts     # types
server.js        # demo app (not published)
tests/           # unit + integration
```

## License
MIT
