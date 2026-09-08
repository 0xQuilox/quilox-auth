module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/api/routes/postRoutes.js', '!src/api/routes/userRoutes.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  maxWorkers: 1,
};
