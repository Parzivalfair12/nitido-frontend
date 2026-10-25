import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionServicio } from './sesion.servicio';

/**
 * Pregunta si hay sesión completa. Si la API no responde bien (se cayó, límite de peticiones, error), se trata como
 * «sin sesión»: es más seguro mostrar el ingreso que dejar la pantalla en blanco o dejar pasar.
 */
async function hayDeSesion(sesion: SesionServicio): Promise<boolean> {
  if (sesion.perfil() !== null) {
    return true;
  }
  try {
    return await sesion.cargar();
  } catch {
    return false;
  }
}

/** Deja pasar solo con sesión completa; si no, lleva a /ingreso y guarda a dónde volver. */
export const autenticada: CanActivateFn = async (_ruta, estado) => {
  const router = inject(Router);
  if (await hayDeSesion(inject(SesionServicio))) {
    return true;
  }
  return router.createUrlTree(['/ingreso'], { queryParams: { volver: estado.url } });
};

/** /ingreso solo para quien no tiene sesión: con sesión, va a /clientes. */
export const sinSesion: CanActivateFn = async () => {
  const router = inject(Router);
  if (await hayDeSesion(inject(SesionServicio))) {
    return router.createUrlTree(['/clientes']);
  }
  return true;
};
