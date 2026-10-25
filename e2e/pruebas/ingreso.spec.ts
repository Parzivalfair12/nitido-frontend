import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CLAVE, codigoTotp, correoNuevo, ingresarConClave, registrarEInscribir, registrarFirma, salir } from './ayudantes';

async function sinViolacionesGraves(page: import('@playwright/test').Page) {
  const resultado = await new AxeBuilder({ page }).analyze();
  const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.describe('Ingreso', () => {
  test('un usuario sin sesión que abre /clientes termina en /ingreso y, al ingresar, vuelve a /clientes', async ({ page }) => {
    const correo = correoNuevo();
    const { claveManual } = await registrarEInscribir(page, correo);
    await salir(page);

    await page.goto('/clientes');
    await expect(page).toHaveURL(/\/ingreso\?volver=%2Fclientes/);

    await page.getByLabel('Correo').fill(correo);
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('heading', { name: 'Confirma que eres tú' })).toBeVisible();
    await page.getByLabel('Código').fill(codigoTotp(claveManual, 1));
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page).toHaveURL(/\/clientes$/);
  });

  test('la pantalla de ingreso es la del mockup', async ({ page }) => {
    await page.goto('/ingreso');
    await expect(page.getByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeVisible();
    await expect(page.getByText('Usa el correo con el que tu firma te dio acceso.')).toBeVisible();
    await expect(page.getByLabel('Correo')).toHaveAttribute('type', 'email');
    await expect(page.getByLabel('Correo')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Correo')).toHaveAttribute('placeholder', 'nombre@tufirma.com');
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    await expect(page.getByText('¿La olvidaste?')).toHaveCount(0);
    await expect(page.getByText('Mantener la sesión')).toHaveCount(0);
    await expect(page.getByText('¿Tu firma aún no usa Nítido? Solicita acceso')).toBeVisible();

    const boton = page.getByRole('button', { name: 'Ingresar' });
    expect((await boton.boundingBox())?.height).toBe(42);
    const tarjeta = await page.locator('.lg-caja form').boundingBox();
    expect(tarjeta!.width).toBeLessThanOrEqual(380);

    // Cada enlace legal abre y cierra su aviso.
    await page.getByRole('button', { name: 'términos de uso' }).click();
    await expect(page.getByRole('region', { name: 'Términos de uso, resumen' })).toBeVisible();
    await page.getByRole('button', { name: 'política de tratamiento de datos' }).click();
    await expect(page.getByRole('region', { name: 'Política de tratamiento de datos, resumen' })).toBeVisible();
    await page.getByRole('button', { name: 'política de tratamiento de datos' }).click();
    await expect(page.getByRole('region')).toHaveCount(0);

    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('ingreso-credenciales.png', { maxDiffPixelRatio: 0.02 });
  });

  test('valida el correo y la contraseña en pantalla', async ({ page }) => {
    await page.goto('/ingreso');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Escribe un correo válido para ingresar.');
    await page.getByLabel('Correo').fill('ana@ejemplo.co');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Escribe tu contraseña para ingresar.');
  });

  test('un 401 muestra «El correo o la contraseña no coinciden.»', async ({ page }) => {
    await ingresarConClave(page, 'no-existe@ejemplo.co', 'una-clave-equivocada-1');
    await expect(page.getByRole('alert')).toHaveText('El correo o la contraseña no coinciden.');
  });

  test('flujo completo: inscripción, códigos, salida, ingreso con código e ingreso con código de recuperación', async ({ page }) => {
    // Ninguna petición de la inscripción puede salir de localhost: un servicio externo de QR vería el secreto.
    const externas: string[] = [];
    page.on('request', (peticion) => {
      const url = new URL(peticion.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname) && !url.protocol.startsWith('data') && !url.protocol.startsWith('blob')) {
        externas.push(peticion.url());
      }
    });

    const correo = correoNuevo();
    await registrarFirma(page, correo);
    await ingresarConClave(page, correo);

    // Inscripción
    await expect(page.getByRole('heading', { name: 'Protege tu cuenta' })).toBeVisible();
    await expect(page.getByAltText('Código QR para tu aplicación autenticadora')).toBeVisible();
    await expect(page.getByText('¿No puedes escanearlo? Escribe esta clave:')).toBeVisible();
    const claveManual = (await page.locator('.clave-manual').innerText()).replace(/\s/g, '');
    expect(claveManual).toMatch(/^[A-Z2-7]{32}$/);
    expect(await page.locator('.clave-manual').innerText()).toMatch(/^([A-Z2-7]{4} ){7}[A-Z2-7]{4}$/);
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('ingreso-inscripcion.png', { maxDiffPixelRatio: 0.03, mask: [page.locator('.qr'), page.locator('.clave-manual')] });

    // Un código inválido
    await page.getByLabel('Código').fill(codigoTotp(claveManual) === '000000' ? '111111' : '000000');
    await page.getByRole('button', { name: 'Activar' }).click();
    await expect(page.getByRole('alert')).toHaveText('El código no es válido. Revisa que la hora de tu teléfono esté bien y vuelve a intentarlo.');

    // Códigos de recuperación
    await page.getByLabel('Código').fill(codigoTotp(claveManual));
    await page.getByRole('button', { name: 'Activar' }).click();
    await expect(page.getByRole('heading', { name: 'Guarda tus códigos de recuperación' })).toBeVisible();
    await expect(page.getByText('Cada código sirve una sola vez si pierdes tu teléfono.')).toBeVisible();
    const codigos = await page.locator('.codigos li').allInnerTexts();
    expect(codigos).toHaveLength(10);
    const continuar = page.getByRole('button', { name: 'Continuar' });
    await expect(continuar).toBeDisabled();

    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar' }).click();
    expect((await descarga).suggestedFilename()).toBe('codigos-recuperacion-nitido.txt');
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('ingreso-codigos-de-recuperacion.png', { maxDiffPixelRatio: 0.03, mask: [page.locator('.codigos')] });

    await page.getByLabel('Ya guardé mis códigos').check();
    await expect(continuar).toBeEnabled();
    await continuar.click();
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('.yo')).toContainText('Ana Pérez');
    await expect(page.locator('.yo')).toContainText('Administrador');

    // Salida
    await salir(page);
    await page.goto('/clientes');
    await expect(page).toHaveURL(/\/ingreso/);

    // Ingreso con el código de la aplicación (el del paso siguiente: el de la inscripción ya se usó)
    await ingresarConClave(page, correo);
    await expect(page.getByRole('heading', { name: 'Confirma que eres tú' })).toBeVisible();
    await expect(page.getByLabel('Código')).toHaveAttribute('inputmode', 'numeric');
    await expect(page.getByLabel('Código')).toHaveAttribute('autocomplete', 'one-time-code');
    await sinViolacionesGraves(page);
    await expect(page).toHaveScreenshot('ingreso-codigo.png', { maxDiffPixelRatio: 0.02 });
    await page.getByLabel('Código').fill(codigoTotp(claveManual, 1));
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page).toHaveURL(/\/clientes$/);
    await salir(page);

    // Ingreso con un código de recuperación
    await ingresarConClave(page, correo);
    await page.getByRole('button', { name: 'Usar un código de recuperación' }).click();
    await expect(page.getByLabel('Código de recuperación')).toBeVisible();
    await page.getByLabel('Código de recuperación').fill(codigos[0]);
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page).toHaveURL(/\/clientes$/);
    await salir(page);

    // Y ese código no sirve otra vez.
    await ingresarConClave(page, correo);
    await page.getByRole('button', { name: 'Usar un código de recuperación' }).click();
    await page.getByLabel('Código de recuperación').fill(codigos[0]);
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByRole('alert')).toContainText('El código no es válido');

    expect(externas, `Peticiones fuera de localhost: ${externas.join(', ')}`).toEqual([]);
  });
});
