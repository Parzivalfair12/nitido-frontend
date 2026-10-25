import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';

/** Cuánto dura el aviso emergente en pantalla (mockup: 6 segundos). */
export const DURACION_DEL_TOAST_MS = 6000;

@Injectable({ providedIn: 'root' })
export class ToastServicio {
  readonly mensaje = signal<string | null>(null);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  /** Muestra el aviso abajo al centro durante 6 segundos. Uno nuevo reemplaza al anterior. */
  mostrar(texto: string): void {
    clearTimeout(this.temporizador);
    this.mensaje.set(texto);
    this.temporizador = setTimeout(() => this.mensaje.set(null), DURACION_DEL_TOAST_MS);
  }

  cerrar(): void {
    clearTimeout(this.temporizador);
    this.mensaje.set(null);
  }
}

/** Toast de Cristal: abajo al centro, fondo oscuro translúcido, `role="status"`. Va una sola vez, en la raíz. */
@Component({
  selector: 'nt-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (servicio.mensaje(); as texto) {
      <div class="toast" role="status">{{ texto }}</div>
    }
  `,
})
export class NtToast {
  protected readonly servicio = inject(ToastServicio);
}
