import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { correoNuevo, registrarEInscribir } from './ayudantes';

async function sinViolacionesGraves(page: import('@playwright/test').Page) {
  const resultado = await new AxeBuilder({ page }).analyze();
  const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.describe('Clientes', () => {
  test('agregar un cliente con NIT y verlo en la lista con su dígito de verificación', async ({ page }) => {
    await registrarEInscribir(page, correoNuevo());

    // Sin clientes
    await expect(page.getByRole('heading', { name: 'Clientes', level: 1 })).toBeVisible();
    await expect(page.getByText(/^\w+ \d{4}\. 0 clientes\.$/)).toBeVisible();
    await expect(page.getByText('Aún no tienes clientes')).toBeVisible();
    await expect(page.getByText('Agrega el primero con el botón Agregar cliente.')).toBeVisible();
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('clientes-sin-clientes.png', { maxDiffPixelRatio: 0.02, mask: [page.locator('.hd p'), page.locator('th, [role=columnheader]').nth(2)] });

    // Formulario con error
    await page.getByRole('button', { name: 'Agregar cliente' }).click();
    await expect(page.getByLabel('Razón social o nombre')).toHaveAttribute('placeholder', 'Distribuidora Andina SAS');
    await expect(page.getByLabel('NIT o cédula')).toHaveAttribute('placeholder', '901234567');
    await page.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(page.getByRole('alert')).toHaveText('Escribe la razón social o el nombre del cliente.');
    await page.getByLabel('Razón social o nombre').fill('Distribuciones Andina S.A.S.');
    await page.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(page.getByRole('alert')).toHaveText('Escribe el NIT o la cédula del cliente.');
    await page.getByLabel('NIT o cédula').fill('1020304050');
    await page.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(page.getByRole('alert')).toContainText('Por ahora solo puedes agregar clientes con NIT');
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('clientes-formulario-con-error.png', { maxDiffPixelRatio: 0.02, mask: [page.locator('.hd p')] });

    // Guardar
    await page.getByLabel('NIT o cédula').fill('800.197.268');
    await page.getByRole('button', { name: 'Guardar cliente' }).click();
    const toast = page.getByRole('status');
    await expect(toast).toHaveText('Distribuciones Andina S.A.S. agregado');
    await expect(page.getByRole('button', { name: 'Guardar cliente' })).toHaveCount(0);
    const fila = page.getByRole('row', { name: /Distribuciones Andina/ });
    await expect(fila).toContainText('NIT 800.197.268-4');
    await expect(fila).toContainText('Sin documentos');
    await expect(page.getByText(/^\w+ \d{4}\. 1 cliente\.$/)).toBeVisible();

    // Un NIT repetido en la misma firma
    await page.getByRole('button', { name: 'Agregar cliente' }).click();
    await page.getByLabel('Razón social o nombre').fill('Otra razón social');
    await page.getByLabel('NIT o cédula').fill('800197268-4');
    await page.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(page.getByRole('alert')).toHaveText('Este cliente ya está en tu firma.');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('button', { name: 'Guardar cliente' })).toHaveCount(0);

    // Más clientes, para la lista y la búsqueda
    for (const [razon, nit] of [
      ['Bancolombia', '890903938'],
      ['Almacén Alfa', '860.002.964-4'],
    ]) {
      await page.getByRole('button', { name: 'Agregar cliente' }).click();
      await page.getByLabel('Razón social o nombre').fill(razon);
      await page.getByLabel('NIT o cédula').fill(nit);
      await page.getByRole('button', { name: 'Guardar cliente' }).click();
      await expect(page.getByRole('row', { name: new RegExp(razon) })).toBeVisible();
    }

    // Ordenados por razón social
    const razones = await page.locator('[role=row] .b5').allInnerTexts();
    expect(razones).toEqual(['Almacén Alfa', 'Bancolombia', 'Distribuciones Andina S.A.S.']);
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('clientes-lista.png', { maxDiffPixelRatio: 0.02, mask: [page.locator('.hd p'), page.getByRole('status')] });

    // Búsqueda: ignora mayúsculas, puntos y guion
    const busqueda = page.getByLabel('Buscar por nombre o NIT');
    await busqueda.fill('800.197');
    await expect(page.locator('[role=row] .b5')).toHaveText(['Distribuciones Andina S.A.S.']);
    await busqueda.fill('800197');
    await expect(page.locator('[role=row] .b5')).toHaveText(['Distribuciones Andina S.A.S.']);
    await busqueda.fill('BANCO');
    await expect(page.locator('[role=row] .b5')).toHaveText(['Bancolombia']);
    await busqueda.fill('zzz');
    await expect(page.getByText('Ningún cliente coincide con «zzz»')).toBeVisible();
    await expect(page.getByText('Busca por razón social o por número de documento.')).toBeVisible();
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('clientes-busqueda-sin-resultados.png', { maxDiffPixelRatio: 0.02, mask: [page.locator('.hd p')] });
  });

  test('una segunda firma ingresa y no ve ese cliente', async ({ browser }) => {
    const contextoA = await browser.newContext();
    const paginaA = await contextoA.newPage();
    await registrarEInscribir(paginaA, correoNuevo(), 'Firma A');
    await paginaA.getByRole('button', { name: 'Agregar cliente' }).click();
    await paginaA.getByLabel('Razón social o nombre').fill('Cliente secreto de la firma A');
    await paginaA.getByLabel('NIT o cédula').fill('900123456');
    await paginaA.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(paginaA.getByRole('row', { name: /Cliente secreto/ })).toBeVisible();

    const contextoB = await browser.newContext();
    const paginaB = await contextoB.newPage();
    await registrarEInscribir(paginaB, correoNuevo(), 'Firma B');
    await expect(paginaB.getByText('Aún no tienes clientes')).toBeVisible();
    await expect(paginaB.getByText('Cliente secreto de la firma A')).toHaveCount(0);
    await expect(paginaB.getByText('NIT 900.123.456-')).toHaveCount(0);

    // El mismo NIT sí puede ser cliente de la otra firma.
    await paginaB.getByRole('button', { name: 'Agregar cliente' }).click();
    await paginaB.getByLabel('Razón social o nombre').fill('Mismo NIT, otra firma');
    await paginaB.getByLabel('NIT o cédula').fill('900123456');
    await paginaB.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(paginaB.getByRole('row', { name: /Mismo NIT, otra firma/ })).toBeVisible();
    await expect(paginaB.getByText('Cliente secreto de la firma A')).toHaveCount(0);

    await contextoA.close();
    await contextoB.close();
  });
});
