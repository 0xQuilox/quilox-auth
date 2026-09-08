const jwtUtils = require('../../src/utils/jwtUtils');

describe('jwtUtils', () => {
  const secret = 'test_secret_12345678901234567890';
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.JWT_REFRESH_SECRET = secret + '_refresh';
  });

  test('generateToken & verifyToken roundtrip', () => {
    const token = jwtUtils.generateToken({ id: '123', role: 'admin' });
    expect(typeof token).toBe('string');
    const decoded = jwtUtils.verifyToken(token);
    expect(decoded.id).toBe('123');
    expect(decoded.role).toBe('admin');
  });

  test('verifyToken returns null for invalid token', () => {
    expect(jwtUtils.verifyToken('invalid')).toBeNull();
    expect(jwtUtils.verifyToken('')).toBeNull();
    expect(jwtUtils.verifyToken(null)).toBeNull();
  });

  test('generateToken throws without payload', () => {
    expect(() => jwtUtils.generateToken(null)).toThrow();
  });

  test('expired token returns null', async () => {
    const token = jwtUtils.generateToken({ id: '1' }, { expiresIn: '1s' });
    await new Promise((r) => setTimeout(r, 1100));
    expect(jwtUtils.verifyToken(token)).toBeNull();
  });

  test('refresh token flow', () => {
    const rt = jwtUtils.generateRefreshToken({ id: '99' });
    expect(jwtUtils.verifyRefreshToken(rt).id).toBe('99');
    expect(jwtUtils.verifyToken(rt)).toBeNull(); // access verify should not verify refresh if secrets differ? Here they differ, so null
  });
});
