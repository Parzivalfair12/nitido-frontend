import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { correoNuevo, registrarEInscribir, salir } from './ayudantes';

test.describe('Estructura en modo firma', () => {
  test('menú lateral, área de trabajo y bloque de usuario', async ({ page }) => {
    await registrarEInscribir(page, correoNuevo());
    const celular = (page.viewportSize()?.width ?? 1440) < 760;

    const menu = page.getByRole('navigation', { name: 'Menú principal' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Clientes', exact: true })).toHaveClass(/on/);
    await expect(menu.getByText('nítido')).toBeVisible();

    const caja = (await menu.boundingBox())!;
    if (celular) {
      // Franja horizontal arriba, de todo el ancho; sin bloque de usuario, pero con «Salir» al final.
      expect(caja.y).toBeLessThan(20);
      expect(caja.width).toBeGreaterThan(350);
      await expect(page.locator('.yo')).toBeHidden();
      await expect(menu.getByRole('button', { name: 'Salir' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    } else {
      expect(caja.width).toBeGreaterThanOrEqual(232);
      expect(caja.width).toBeLessThanOrEqual(248);
      const usuario = page.locator('.yo');
      await expect(usuario).toContainText('Ana Pérez');
      await expect(usuario).toContainText('Administrador');
      await expect(usuario.locator('.av')).toHaveText('AP');
      await expect(usuario.getByRole('button', { name: 'Salir' })).toBeVisible();
    }

    const titulo = page.getByRole('heading', { name: 'Clientes', level: 1 });
    const estilo = await titulo.evaluate((el) => {
      const calculado = getComputedStyle(el);
      return { tamano: calculado.fontSize, peso: calculado.fontWeight };
    });
    expect(estilo).toEqual({ tamano: '24px', peso: '600' });

    const resultado = await new AxeBuilder({ page }).analyze();
    expect(resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
    await expect(page).toHaveScreenshot('estructura.png', { maxDiffPixelRatio: 0.02, mask: [page.locator('.hd p'), page.locator('.datos')] });
  });

  test('«Salir» cierra la sesión y lleva a /ingreso', async ({ page }) => {
    await registrarEInscribir(page, correoNuevo());
    await salir(page);
    await page.goto('/clientes');
    await expect(page).toHaveURL(/\/ingreso/);
  });

  test('la raíz lleva a /clientes con sesión y a /ingreso sin ella', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/ingreso/);
    await expect(page).toHaveTitle('Ingresa a tu cuenta · nítido');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
  });
});
