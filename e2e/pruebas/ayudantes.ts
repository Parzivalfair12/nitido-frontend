import { expect, Page } from '@playwright/test';
import { Secret, TOTP } from 'otpauth';

export const CLAVE = 'una-clave-larga-123';

export function correoNuevo(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@ejemplo.co`;
}

/** El código TOTP de la aplicación autenticadora, a partir de la clave que muestra la pantalla de inscripción. */
export function codigoTotp(claveManual: string, pasosAdelante = 0): string {
  const totp = new TOTP({ secret: Secret.fromBase32(claveManual.replace(/\s/g, '')), digits: 6, period: 30, algorithm: 'SHA1' });
  return totp.generate({ timestamp: Date.now() + pasosAdelante * 30_000 });
}

/**
 * Registra una firma y su administrador con la API, como lo haría una herramienta de soporte: no hay pantalla de
 * registro en la fase 0. Se hace desde la página para usar su cookie de antifalsificación.
 */
export async function registrarFirma(page: Page, correo: string, nombreFirma = 'Firma de prueba', nombre = 'Ana Pérez'): Promise<void> {
  await page.goto('/ingreso');
  await expect(page.getByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeVisible();
  const estado = await page.evaluate(
    async (datos) => {
      const token = decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
      const respuesta = await fetch('/api/firmas/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
        body: JSON.stringify({ nombreFirma: datos.nombreFirma, administrador: { nombre: datos.nombre, correo: datos.correo, clave: datos.clave } }),
      });
      return respuesta.status;
    },
    { correo, nombreFirma, nombre, clave: CLAVE },
  );
  expect(estado).toBe(201);
}

/** Escribe el correo y la contraseña y pulsa «Ingresar». */
export async function ingresarConClave(page: Page, correo: string, clave = CLAVE): Promise<void> {
  await page.goto('/ingreso');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

/** Registra la firma, ingresa, inscribe el doble factor y entra a /clientes. Devuelve la clave del TOTP y los códigos de recuperación. */
export async function registrarEInscribir(page: Page, correo: string, nombreFirma = 'Firma de prueba'): Promise<{ claveManual: string; codigos: string[] }> {
  await registrarFirma(page, correo, nombreFirma);
  await ingresarConClave(page, correo);
  await expect(page.getByRole('heading', { name: 'Protege tu cuenta' })).toBeVisible();
  const claveManual = (await page.locator('.clave-manual').innerText()).replace(/\s/g, '');
  await page.getByLabel('Código').fill(codigoTotp(claveManual));
  await page.getByRole('button', { name: 'Activar' }).click();
  await expect(page.getByRole('heading', { name: 'Guarda tus códigos de recuperación' })).toBeVisible();
  const codigos = await page.locator('.codigos li').allInnerTexts();
  await page.getByLabel('Ya guardé mis códigos').check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL(/\/clientes$/);
  return { claveManual, codigos };
}

export async function salir(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  const boton = viewport && viewport.width < 760 ? page.locator('.it.salir') : page.locator('.yo').getByRole('button', { name: 'Salir' });
  await boton.click();
  await expect(page).toHaveURL(/\/ingreso/);
}
