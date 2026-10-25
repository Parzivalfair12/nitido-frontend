import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AutenticacionApi } from './api/autenticacion.api';
import { ToastServicio } from '../compartido/toast';
import { PerfilDeSesion } from './api/modelos';

/** Quién tiene la sesión. La verdad está en la cookie del servidor: aquí solo se guarda lo que responde /yo. */
@Injectable({ providedIn: 'root' })
export class SesionServicio {
  private readonly api = inject(AutenticacionApi);
  private readonly toast = inject(ToastServicio);

  readonly perfil = signal<PerfilDeSesion | null>(null);

  /** Pregunta al servidor si hay sesión completa. Devuelve `true` si la hay. */
  async cargar(): Promise<boolean> {
    try {
      this.perfil.set(await firstValueFrom(this.api.yo()));
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.perfil.set(null);
        return false;
      }
      throw error;
    }
  }

  /** Cierra la sesión en el servidor y olvida el perfil: no se deja en memoria nada de quien salió. */
  async salir(): Promise<void> {
    try {
      await firstValueFrom(this.api.salir());
    } finally {
      this.perfil.set(null);
      // Un aviso con el nombre de un cliente no debe quedar en pantalla después de salir (regla 3).
      this.toast.cerrar();
    }
  }

  /** Olvida el perfil sin llamar al servidor (la sesión ya venció). */
  olvidar(): void {
    this.perfil.set(null);
    this.toast.cerrar();
  }
}
