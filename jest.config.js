module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/integration/**/*.test.js'],
  setupFiles: ['<rootDir>/integration/setup-env.js'],
  testTimeout: 20000
};
