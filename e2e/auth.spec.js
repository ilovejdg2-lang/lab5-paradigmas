var { test, expect } = require('@playwright/test');
var RETRASO_MS = require('./retraso');

test('usuario no autenticado ve la puerta de acceso y no el chat', async function ({ page }) {
  await page.goto('/');
  await expect(page.locator('#auth-gate')).toBeVisible();
  await expect(page.locator('#chat-panel')).toBeHidden();
  await expect(page.locator('#auth-status')).toBeVisible();
  await page.waitForTimeout(RETRASO_MS);
});

test('estado de carga no muestra el contenido privado del chat', async function ({ page }) {
  await page.goto('/');
  await expect(page.locator('#messages')).toBeHidden();
  await expect(page.locator('#m')).toBeHidden();
  await page.waitForTimeout(RETRASO_MS);
});

test('muestra botón de inicio de sesión o reintento ante falta de sesión Auth0 real', async function ({ page }) {
  await page.goto('/');
  // Dominio de prueba: el SDK falla o expira; debe quedar una acción visible (no el primer hidden del DOM)
  var accion = page.locator('#btn-login:not([hidden]), #btn-retry:not([hidden])');
  await expect(accion.first()).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(RETRASO_MS);
});
