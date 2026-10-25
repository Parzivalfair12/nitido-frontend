import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { iniciales } from './formato';
import { NtLogo } from './componentes';

/**
 * Menú lateral de vidrio (modo firma). En la fase 0 tiene solo «Clientes»; abajo, el bloque de usuario con las
 * iniciales, el nombre, el rol y «Salir». Por debajo de 760 px pasa a una franja horizontal arriba y el bloque de
 * usuario se oculta; «Salir» queda entonces al final de la franja (diferencia con el mockup, F0-05a).
 */
@Component({
  selector: 'nt-menu-lateral',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NtLogo, RouterLink, RouterLinkActive],
  host: { class: 'sb', role: 'navigation', 'aria-label': 'Menú principal' },
  template: `
    <a class="sb-m" routerLink="/clientes" aria-label="nítido, ir a Clientes">
      <nt-logo [tamano]="24" [enMenu]="true" />
      <span class="marca">nítido</span>
    </a>
    <a class="it" routerLink="/clientes" routerLinkActive="on" ariaCurrentWhenActive="page">Clientes</a>
    <button class="it salir" type="button" (click)="salir.emit()">Salir</button>
    <div class="yo">
      <span class="av" aria-hidden="true">{{ siglas() }}</span>
      <span class="datos">
        {{ nombre() }}
        <span class="sm">{{ rol() }}</span>
      </span>
      <button class="bt gh sm2" type="button" (click)="salir.emit()">Salir</button>
    </div>
  `,
  styles: `
    .yo {
      gap: 8px;
    }
    .yo .bt {
      padding: 0 8px;
    }
    .datos {
      flex: 1;
      line-height: 1.3;
      min-width: 0;
      overflow-wrap: break-word;
    }
    .datos .sm {
      display: block;
    }
    a.sb-m,
    a.it {
      text-decoration: none;
    }
  `,
})
export class NtMenuLateral {
  readonly nombre = input.required<string>();
  readonly rol = input.required<string>();
  readonly salir = output<void>();

  protected readonly siglas = computed(() => iniciales(this.nombre()));
}

/**
 * Área de trabajo de vidrio con encabezado: título de 24 px, subtítulo y las acciones a la derecha
 * (se proyectan con el atributo `acciones`). El contenido va debajo.
 */
@Component({
  selector: 'nt-area-trabajo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mc' },
  template: `
    <header class="hd">
      <div>
        <h1>{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p>{{ subtitulo() }}</p>
        }
      </div>
      <div class="ac"><ng-content select="[acciones]" /></div>
    </header>
    <ng-content />
  `,
})
export class NtAreaTrabajo {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
}
