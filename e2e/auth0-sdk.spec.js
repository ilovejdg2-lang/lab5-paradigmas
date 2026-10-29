/**
 * Comprueba la carga real del bundle Auth0 SPA (CDN), sin mock de createAuth0Client.
 */
var { test, expect } = require('@playwright/test');

test.describe('SDK Auth0 real (CDN)', function () {
  test('window.auth0.createAuth0Client está definido tras cargar la página', async function ({ page }) {
    await page.goto('/');
    await page.waitForFunction(function () {
      return window.auth0 && typeof window.auth0.createAuth0Client === 'function';
    }, null, { timeout: 20000 });

    var api = await page.evaluate(function () {
      return {
        hasNamespace: !!window.auth0,
        createIsFunction: typeof window.auth0.createAuth0Client === 'function',
        looseGlobal: typeof window.createAuth0Client,
        sdkLoadErrorFlag: !!window.__AUTH0_SDK_LOAD_ERROR__
      };
    });

    expect(api.hasNamespace).toBe(true);
    expect(api.createIsFunction).toBe(true);
    expect(api.looseGlobal).toBe('undefined');
    expect(api.sdkLoadErrorFlag).toBe(false);
  });

  test('no muestra el error createAuth0Client is not defined', async function ({ page }) {
    await page.goto('/');
    await page.waitForSelector('#auth-status', { timeout: 20000 });
    // Esperar a que termine la inicialización (login visible o error distinto)
    await page.waitForFunction(function () {
      var status = document.getElementById('auth-status');
      var login = document.getElementById('btn-login');
      var retry = document.getElementById('btn-retry');
      if (!status) return false;
      var text = status.textContent || '';
      if (/createAuth0Client is not defined/i.test(text)) return true;
      if (login && !login.hidden) return true;
      if (retry && !retry.hidden) return true;
      return false;
    }, null, { timeout: 25000 });

    var text = await page.locator('#auth-status').innerText();
    expect(text).not.toMatch(/createAuth0Client is not defined/i);
    expect(text).not.toMatch(/Error de configuración: createAuth0Client/i);
  });

  test('el botón Iniciar sesión invoca el flujo authorize del SDK', async function ({ page }) {
    await page.goto('/');
    await page.waitForSelector('#btn-login:not([hidden])', { timeout: 25000 });

    // En e2e el servidor usa dominio de prueba; igual el SDK debe emitir /authorize.
    var authorizeWait = page.waitForRequest(
      function (req) {
        return /\/authorize|auth0\.com|test-issuer\.local/i.test(req.url());
      },
      { timeout: 20000 }
    ).catch(function () { return null; });

    var navWait = page.waitForURL(/auth0\.com|\/authorize|test-issuer/i, { timeout: 20000 }).catch(function () {
      return null;
    });

    await page.locator('#btn-login').click();
    var req = await authorizeWait;
    var nav = await navWait;

    expect(req || nav).toBeTruthy();
  });
});
