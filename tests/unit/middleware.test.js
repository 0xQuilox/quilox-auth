const authMiddleware = require('../../src/middleware/authMiddleware');
const rbacMiddleware = require('../../src/middleware/rbacMiddleware');
const jwtUtils = require('../../src/utils/jwtUtils');

describe('authMiddleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_1234567890_test_secret';
  });

  function mockReq(headers = {}) {
    return { headers };
  }
  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  test('rejects without header', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts valid Bearer token', () => {
    const token = jwtUtils.generateToken({ id: 'u1', role: 'admin' });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('u1');
  });

  test('case-insensitive Bearer', () => {
    const token = jwtUtils.generateToken({ id: 'u1', role: 'user' });
    const req = mockReq({ authorization: `bearer ${token}` });
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('rbacMiddleware', () => {
  function reqWithUser(role) {
    return { user: { role } };
  }
  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  test('admin bypass with manage:all', () => {
    const mw = rbacMiddleware(['delete:user']);
    const req = reqWithUser('admin');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('viewer denied for delete:user', () => {
    const mw = rbacMiddleware(['delete:user']);
    const req = reqWithUser('viewer');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('manage_users alias works', () => {
    const mw = rbacMiddleware(['manage_users']);
    const req = reqWithUser('admin');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('custom permissions injection', () => {
    const mw = rbacMiddleware(['custom:perm'], { permissions: { customRole: ['custom:perm'] } });
    const req = reqWithUser('customRole');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
