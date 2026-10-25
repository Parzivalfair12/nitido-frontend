import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NtMenuLateral } from '../../compartido/estructura';
import { SesionServicio } from '../../nucleo/sesion.servicio';

const ROLES: Record<string, string> = { ADMINISTRADOR: 'Administrador' };

/** Estructura en modo firma: menú lateral a la izquierda y el área de trabajo de cada pantalla a la derecha. */
@Component({
  selector: 'nt-estructura',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NtMenuLateral, RouterOutlet],
  host: { class: 'sh' },
  template: `
    <nt-menu-lateral [nombre]="nombre()" [rol]="rol()" (salir)="salir()" />
    <router-outlet />
  `,
})
export class Estructura {
  private readonly sesion = inject(SesionServicio);
  private readonly router = inject(Router);

  protected readonly nombre = computed(() => this.sesion.perfil()?.nombre ?? '');
  protected readonly rol = computed(() => {
    const rol = this.sesion.perfil()?.rol ?? '';
    return ROLES[rol] ?? rol;
  });

  protected async salir(): Promise<void> {
    await this.sesion.salir();
    await this.router.navigateByUrl('/ingreso');
  }
}
