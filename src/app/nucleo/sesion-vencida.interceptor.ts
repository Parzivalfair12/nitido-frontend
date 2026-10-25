import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SesionServicio } from './sesion.servicio';

// En /api/autenticacion/ un 401 es una respuesta normal (clave o código equivocados, o aún no hay sesión): lo maneja la pantalla.
const RUTAS_CON_401_NORMAL = ['/api/autenticacion/'];

/** Si la sesión vence con la aplicación abierta, cualquier otro 401 de la API lleva a /ingreso. */
export const sesionVencida: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionServicio);
  const router = inject(Router);
  return siguiente(peticion).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !RUTAS_CON_401_NORMAL.some((ruta) => peticion.url.startsWith(ruta)) &&
        sesion.perfil() !== null
      ) {
        sesion.olvidar();
        void router.navigate(['/ingreso'], { queryParams: { volver: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
