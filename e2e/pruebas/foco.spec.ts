import { expect, test } from '@playwright/test';
import { correoNuevo, registrarEInscribir } from './ayudantes';

test('al recorrer el menú con Tab, cada elemento muestra un contorno de 2 px en --accent', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) < 760, 'El recorrido del menú se prueba en computador.');
  await registrarEInscribir(page, correoNuevo());

  const acento = await page.evaluate(() => {
    const sonda = document.createElement('div');
    sonda.style.color = 'var(--accent)';
    document.body.appendChild(sonda);
    const color = getComputedStyle(sonda).color;
    sonda.remove();
    return color;
  });

  await page.locator('body').click({ position: { x: 5, y: 5 } });
  const menu = page.getByRole('navigation', { name: 'Menú principal' });
  const visitados: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const foco = page.locator(':focus');
    if (!(await menu.locator(':focus').count())) {
      break;
    }
    const contorno = await foco.evaluate((el) => {
      const calculado = getComputedStyle(el);
      return { ancho: calculado.outlineWidth, estilo: calculado.outlineStyle, color: calculado.outlineColor };
    });
    expect(contorno).toEqual({ ancho: '2px', estilo: 'solid', color: acento });
    visitados.push((await foco.innerText()).trim() || (await foco.getAttribute('aria-label')) || '?');
  }

  expect(visitados.length).toBeGreaterThanOrEqual(2); // logo, Clientes, Salir
});
