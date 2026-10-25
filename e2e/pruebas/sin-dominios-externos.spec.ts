import { expect, test } from '@playwright/test';
import { correoNuevo, registrarEInscribir } from './ayudantes';

test('ninguna petición de la página sale de localhost (la fuente se sirve desde la aplicación)', async ({ page }) => {
  const externas: string[] = [];
  page.on('request', (peticion) => {
    const url = new URL(peticion.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol.startsWith('http')) {
      externas.push(peticion.url());
    }
  });

  await page.goto('/ingreso');
  await page.evaluate(() => document.fonts.ready);
  await registrarEInscribir(page, correoNuevo());
  await page.evaluate(() => document.fonts.ready);

  expect(externas, `Peticiones fuera de localhost: ${externas.join(', ')}`).toEqual([]);
});
