import { HttpErrorResponse } from '@angular/common/http';
import { ProblemaDeApi } from './api/modelos';

export const MENSAJE_SIN_CONEXION = 'No pudimos conectar con nítido. Revisa tu conexión e inténtalo de nuevo.';
export const MENSAJE_INESPERADO = 'Algo salió mal. Inténtalo de nuevo en unos minutos.';

/**
 * El texto que se le muestra a la persona cuando la API responde con error. Sale del ProblemDetails: el primer mensaje
 * de campo si hay errores de validación y, si no, el `title` (no un campo `mensaje`; ver ADR 0001).
 */
export function mensajeDeError(error: unknown, porDefecto = MENSAJE_INESPERADO): string {
  if (!(error instanceof HttpErrorResponse)) {
    return porDefecto;
  }
  if (error.status === 0) {
    return MENSAJE_SIN_CONEXION;
  }
  const problema = error.error as ProblemaDeApi | null;
  const primerCampo = problema?.errors ? Object.values(problema.errors)[0]?.[0] : undefined;
  return primerCampo ?? problema?.title ?? porDefecto;
}

export function esHttp(error: unknown, estado: number): boolean {
  return error instanceof HttpErrorResponse && error.status === estado;
}
