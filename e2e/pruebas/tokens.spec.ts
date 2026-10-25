import { expect, test } from '@playwright/test';

// Valores del tema `.ap.t-cristal` del mockup (docs/mockup-nitido.dc.html) y de la skill diseno-cristal.
const COLORES: Record<string, string> = {
  '--accent': 'rgb(59, 38, 196)', // #3B26C4
  '--ink': 'rgb(15, 23, 42)', // #0F172A
  '--ok': 'rgb(21, 128, 61)', // #15803D
  '--warn': 'rgb(154, 88, 0)', // #9A5800
  '--err': 'rgb(180, 35, 24)', // #B42318
  '--side-bg': 'rgba(255, 255, 255, 0.42)',
};

test('los tokens de Cristal tienen los valores del mockup', async ({ page }) => {
  await page.goto('/ingreso');

  const calculados = await page.evaluate((colores) => {
    const sonda = document.createElement('div');
    document.body.appendChild(sonda);
    const resultado: Record<string, string> = {};
    for (const token of Object.keys(colores)) {
      sonda.style.backgroundColor = `var(${token})`;
      resultado[token] = getComputedStyle(sonda).backgroundColor;
    }
    sonda.remove();
    const raiz = getComputedStyle(document.documentElement);
    return { colores: resultado, r: raiz.getPropertyValue('--r').trim(), r2: raiz.getPropertyValue('--r2').trim() };
  }, COLORES);

  expect(calculados.colores).toEqual(COLORES);
  expect(calculados.r).toBe('10px');
  expect(calculados.r2).toBe('16px');
});

test('la fuente Geist se sirve desde la propia aplicación', async ({ page }) => {
  await page.goto('/ingreso');
  await page.evaluate(() => document.fonts.ready);
  const familias = await page.evaluate(() => Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => `${f.family}:${f.weight}`));
  expect(familias.some((f) => f.startsWith('Geist'))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Geist');
});
