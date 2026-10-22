var { test, expect } = require('@playwright/test');
var RETRASO_MS = require('./retraso');

async function verResultado(page) {
  await page.waitForTimeout(RETRASO_MS);
}

async function enviar(page, mensaje) {
  await page.locator('#m').fill(mensaje);
  await page.locator('form button').click();
}

test.beforeEach(async function ({ page }) {
  await page.goto('/');
  await page.locator('#nombre').fill('Ana');
});

test('muestra un texto tal como se escribio', async function ({ page }) {
  await enviar(page, 'Hola, este es un mensaje');
  var linea = page.locator('#messages li').last();
  await expect(linea).toContainText('Ana');
  await expect(linea).toContainText('Hola, este es un mensaje');
  await expect(page.locator('#messages img')).toHaveCount(0);
  await verResultado(page);
});

test('muestra una url de imagen dentro del chat', async function ({ page }) {
  await enviar(page, 'http://image.com/image.jpg');
  var imagen = page.locator('#messages img');
  await expect(imagen).toHaveCount(1);
  await expect(imagen).toHaveAttribute('src', 'http://image.com/image.jpg');
  await verResultado(page);
});

test('inserta el reproductor de un enlace compartido de youtube', async function ({ page }) {
  await enviar(page, 'https://youtu.be/qYwlqx-JLok?si=AbCdEfGh12');
  var reproductor = page.locator('#messages iframe');
  await expect(reproductor).toHaveCount(1);
  await expect(reproductor).toHaveAttribute('src', 'https://www.youtube.com/embed/qYwlqx-JLok');
  await verResultado(page);
});

test('muestra un short de youtube como reproductor', async function ({ page }) {
  await enviar(page, 'https://www.youtube.com/shorts/qYwlqx-JLok');
  var reproductor = page.locator('#messages iframe');
  await expect(reproductor).toHaveCount(1);
  await expect(reproductor).toHaveAttribute('src', 'https://www.youtube.com/embed/qYwlqx-JLok');
  await verResultado(page);
});

test('muestra un video de instagram como reproductor', async function ({ page }) {
  await enviar(page, 'https://www.instagram.com/reel/Cxyz123/?igsh=abc');
  var reproductor = page.locator('#messages iframe');
  await expect(reproductor).toHaveCount(1);
  await expect(reproductor).toHaveAttribute('src', 'https://www.instagram.com/reel/Cxyz123/embed');
  await verResultado(page);
});

test('muestra un video de google drive como reproductor', async function ({ page }) {
  await enviar(page, 'https://drive.google.com/file/d/1AbCdefGhijk/view?usp=sharing');
  var reproductor = page.locator('#messages iframe');
  await expect(reproductor).toHaveCount(1);
  await expect(reproductor).toHaveAttribute('src', 'https://drive.google.com/file/d/1AbCdefGhijk/preview');
  var caja = await reproductor.boundingBox();
  expect(caja && caja.height).toBeGreaterThan(200);
  await verResultado(page);
});

test('no ejecuta un script escrito en el mensaje', async function ({ page }) {
  await enviar(page, '<script>alert("xss")</script>');
  var linea = page.locator('#messages li').last();
  await expect(page.locator('#messages script')).toHaveCount(0);
  await expect(linea).toContainText('<script>alert("xss")</script>');
  await verResultado(page);
});
