import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CodigosDeRecuperacion,
  InscripcionDeSegundoFactor,
  PerfilDeSesion,
  RespuestaDeIngreso,
} from './modelos';

/** Llamadas a /api/autenticacion. Los POST llevan solos el encabezado X-XSRF-TOKEN (ver app.config.ts). */
@Injectable({ providedIn: 'root' })
export class AutenticacionApi {
  private readonly http = inject(HttpClient);

  yo(): Observable<PerfilDeSesion> {
    return this.http.get<PerfilDeSesion>('/api/autenticacion/yo');
  }

  ingresar(correo: string, clave: string): Observable<RespuestaDeIngreso> {
    return this.http.post<RespuestaDeIngreso>('/api/autenticacion/ingreso', { correo, clave });
  }

  inscripcion(): Observable<InscripcionDeSegundoFactor> {
    return this.http.get<InscripcionDeSegundoFactor>('/api/autenticacion/segundo-factor/inscripcion');
  }

  confirmarInscripcion(codigo: string): Observable<CodigosDeRecuperacion> {
    return this.http.post<CodigosDeRecuperacion>('/api/autenticacion/segundo-factor/inscripcion', { codigo });
  }

  verificarCodigo(codigo: string): Observable<unknown> {
    return this.http.post('/api/autenticacion/segundo-factor', { codigo });
  }

  usarCodigoDeRecuperacion(codigo: string): Observable<unknown> {
    return this.http.post('/api/autenticacion/segundo-factor/recuperacion', { codigo });
  }

  salir(): Observable<void> {
    return this.http.post<void>('/api/autenticacion/salida', {});
  }
}
