const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const {
  applyTestAuthEnv,
  publicKey,
  ISSUER,
  AUDIENCE,
  signAccessToken
} = require('../../test/helpers/test-jwt');

const PORT = '3101';
const BASE = 'http://127.0.0.1:' + PORT;
const root = path.join(__dirname, '..', '..');

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function waitForServer(url, attempts) {
  for (var i = 0; i < attempts; i++) {
    try {
      var res = await fetch(url);
      if (res.ok) return;
    } catch (e) { /* retry */ }
    await sleep(400);
  }
  throw new Error('Server did not start: ' + url);
}

(async () => {
  applyTestAuthEnv();
  var env = Object.assign({}, process.env, {
    PORT: PORT,
    FRONTEND_ORIGIN: BASE,
    SOCKET_PUBLIC_URL: BASE,
    AUTH0_ISSUER_BASE_URL: ISSUER,
    AUTH0_AUDIENCE: AUDIENCE,
    AUTH0_DOMAIN: 'test-issuer.local',
    AUTH0_CLIENT_ID: 'test-client-id',
    AUTH_JWT_PUBLIC_KEY: publicKey
  });

  var child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', function (d) {
    process.stdout.write('[server] ' + d);
  });
  child.stderr.on('data', function (d) {
    process.stderr.write('[server-err] ' + d);
  });

  try {
    await waitForServer(BASE + '/', 40);
    var token = await signAccessToken({
      sub: 'auth0|ana-e2e',
      name: 'Ana',
      email: 'ana@example.com'
    });
    var browser = await chromium.launch();
    var page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.addInitScript(function (payload) {
      window.__E2E_ACCESS_TOKEN__ = payload.token;
      window.__E2E_USER__ = payload.user;
    }, {
      token: token,
      user: { name: 'Ana', email: 'ana@example.com', sub: 'auth0|ana-e2e', picture: '' }
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#chat-panel:not([hidden])', { timeout: 20000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(__dirname, 'ui-chat-desktop.png'), fullPage: true });

    await page.fill('#m', 'Hola desde la revisión UI');
    await page.click('form button[type="submit"]');
    await page.waitForSelector('#messages .msg', { timeout: 10000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(__dirname, 'ui-chat-con-mensaje.png'), fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'ui-chat-mobile-375.png'), fullPage: true });

    await browser.close();
    console.log('SHOTS_OK');
  } finally {
    child.kill('SIGTERM');
  }
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
