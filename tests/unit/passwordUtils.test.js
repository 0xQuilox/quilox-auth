const { hashPassword, comparePassword } = require('../../src/utils/passwordUtils');

describe('passwordUtils', () => {
  test('hash and compare success', async () => {
    const hash = await hashPassword('MySecret123!');
    expect(hash).not.toBe('MySecret123!');
    expect(await comparePassword('MySecret123!', hash)).toBe(true);
    expect(await comparePassword('WrongPass', hash)).toBe(false);
  });

  test('hashPassword rejects empty/invalid', async () => {
    await expect(hashPassword('')).rejects.toThrow();
    await expect(hashPassword(123)).rejects.toThrow();
  });
});
