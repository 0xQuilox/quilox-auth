# Changelog

## 2.0.0 - 2026-09-08
### Breaking Changes
- Fixed all import paths (`authMiddleware`, `authController`, `authRoutes`) - `MODULE_NOT_FOUND` on v1 install.
- Unified `bcrypt` -> `bcryptjs` (pure JS, no native build). `src/utils/passwordUtils.js` now uses `bcryptjs`.
- Removed side-effects on `require()` (`jwtUtils`/`passwordUtils` demos, `console.log`, `setTimeout`) and `process.exit(1)` anti-patterns.
- `rbacMiddleware` now configurable via factory + alias support (`manage_users` -> `manage:all`).
- `jwtUtils` now lazy-validates `JWT_SECRET`, supports `generateRefreshToken`/`verifyRefreshToken`, respects `JWT_EXPIRES_IN` env.
- `authController` hardened: `isActive` check on login/profile, role-escalation guard on register, `changePassword` + `refresh` implemented, pagination on `getAllUsers`.
- `package.json` overhaul: `exports`, `files`, `engines: >=18`, `license: MIT`, `peerDependencies`, `scripts: test/lint`, `joi ^18.2.1`, added `express-rate-limit`, removed dead `passport`/`express-validator`.

### Added
- `src/config/index.js` centralized config
- `src/middleware/rateLimitMiddleware.js` (global + auth limiters)
- `src/middleware/errorMiddleware.js` (404 + centralized handler)
- `src/index.d.ts` TypeScript declarations
- `server.js` now wires `helmet`/`cors`/`morgan`/healthcheck/graceful shutdown
- Tests: `tests/unit/*` + `tests/integration/auth.test.js` (mongodb-memory-server), `jest.config.js`, `eslint`, `prettier`

### Fixed
- Vulnerability audit: `joi 18.0.1` -> `18.2.1`, body-parser transitive.
- `User` model: added `viewer` role, `username` field, `BCRYPT_SALT_ROUNDS` env support.

## 1.0.0 - 2025
- Initial publish: basic middleware + demo app (broken imports, side-effects).
