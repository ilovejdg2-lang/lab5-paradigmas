var { defineConfig } = require('@playwright/test');
var RETRASO_MS = require('./e2e/retraso');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 90000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    headless: false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: RETRASO_MS
    }
  },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 20000,
    env: {
      PORT: '3100'
    }
  }
});
