var { defineConfig } = require('@playwright/test');
var RETRASO_MS = require('./e2e/retraso');
var { applyTestAuthEnv, publicKey, ISSUER, AUDIENCE } = require('./test/helpers/test-jwt');

applyTestAuthEnv();

var authEnv = {
  PORT: '3100',
  FRONTEND_ORIGIN: 'http://127.0.0.1:3100',
  SOCKET_PUBLIC_URL: 'http://127.0.0.1:3100',
  AUTH0_ISSUER_BASE_URL: ISSUER,
  AUTH0_AUDIENCE: AUDIENCE,
  AUTH0_DOMAIN: 'test-issuer.local',
  AUTH0_CLIENT_ID: 'test-client-id',
  AUTH_JWT_PUBLIC_KEY: publicKey
};

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 90000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: RETRASO_MS
    }
  },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 30000,
    env: authEnv
  }
});
