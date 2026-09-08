const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(30000);

// Set env BEFORE requiring app modules
process.env.JWT_SECRET = 'integration_test_secret_1234567890';
process.env.JWT_REFRESH_SECRET = 'integration_refresh_secret_1234567890';
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.NODE_ENV = 'test';

let mongo;
let app;
let mongoose;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  // Require after env set - use same mongoose instance
  mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../../server');
});

afterAll(async () => {
  const m = require('mongoose');
  await m.disconnect();
  if (mongo) await mongo.stop();
});

describe('Auth flow integration', () => {
  const email = 'test@example.com';
  const password = 'Password123!';

  test('register -> login -> profile -> change-password', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({ email, password });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeDefined();

    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const profile = await request(app).get('/api/v1/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user.email).toBe(email);

    const change = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(change.status).toBe(200);

    const relogin = await request(app).post('/api/v1/auth/login').send({ email, password: 'NewPass123!' });
    expect(relogin.status).toBe(200);
  }, 15000);

  test('rbac: non-admin cannot list users', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'NewPass123!' });
    expect(login.status).toBe(200);
    const token = login.body.token;
    const list = await request(app).get('/api/v1/auth/users').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(403);
  }, 10000);

  test('refresh token flow', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'NewPass123!' });
    const refreshToken = login.body.refreshToken;
    expect(refreshToken).toBeDefined();
    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.token).toBeDefined();
  }, 10000);
});
