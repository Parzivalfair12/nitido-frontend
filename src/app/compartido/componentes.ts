import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Botón de Cristal. Uso: `<button ntBoton variante="principal">Guardar</button>`. */
@Component({
  // El selector es un atributo sobre el <button> nativo (no un elemento propio) para conservar su accesibilidad.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[ntBoton]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bt',
    '[class.pr]': 'variante() === "principal"',
    '[class.tx]': 'variante() === "peligro"',
    '[class.gh]': 'variante() === "fantasma"',
    '[class.grande]': 'grande()',
  },
})
export class NtBoton {
  /** principal: `.bt.pr` (36 px, fondo acento); secundario: `.bt`; peligro: `.bt.tx`; fantasma: `.bt.gh`. */
  readonly variante = input<'principal' | 'secundario' | 'peligro' | 'fantasma'>('secundario');
  /** 42 px de alto, como el botón de la pantalla de ingreso. */
  readonly grande = input(false);
}

/** Campo de Cristal (`.cp` + `.in`): etiqueta arriba, 40 px de alto y el error debajo, en un `role="alert"`. */
@Component({
  selector: 'nt-campo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cp' },
  template: `
    <label [for]="idCampo()">{{ etiqueta() }}</label>
    <input
      class="in"
      [id]="idCampo()"
      [type]="tipo()"
      [attr.autocomplete]="autocompletar()"
      [attr.inputmode]="modo()"
      [attr.placeholder]="marcador()"
      [attr.aria-invalid]="error() ? 'true' : null"
      [value]="valor()"
      (input)="valor.set($any($event.target).value)"
    />
    @if (error()) {
      <p class="err" role="alert">{{ error() }}</p>
    }
  `,
})
export class NtCampo {
  /** Id del `<input>` (no se llama `id` para que no se aplique también al elemento `nt-campo`: quedaría repetido). */
  readonly idCampo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly tipo = input<'text' | 'email' | 'password'>('text');
  readonly autocompletar = input<string | null>(null);
  readonly modo = input<'numeric' | null>(null);
  readonly marcador = input<string | null>(null);
  readonly error = input<string>('');
  readonly valor = model('');
}

/** Búsqueda de Cristal (`.bu`): 36 px, ícono de lupa y `aria-label`. */
@Component({
  selector: 'nt-busqueda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bu' },
  template: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7"></circle>
      <path d="M20 20l-3.5-3.5"></path>
    </svg>
    <input
      type="search"
      [attr.placeholder]="etiqueta()"
      [attr.aria-label]="etiqueta()"
      [value]="valor()"
      (input)="valor.set($any($event.target).value)"
    />
  `,
  styles: 'svg { stroke: var(--text4); }',
})
export class NtBusqueda {
  readonly etiqueta = input.required<string>();
  readonly valor = model('');
}

/** Estado de Cristal (`.pt`): punto de 6 px de color más texto. Verde al día, ámbar pendiente, rojo falta algo. */
@Component({
  selector: 'nt-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<i class="pt" [class]="color()" aria-hidden="true"></i><ng-content />',
})
export class NtEstado {
  readonly color = input<'ok' | 'wa' | 'er'>('ok');
}

/** Aviso de Cristal (`.nota`, `.nota.wa`). Con `etiqueta` se anuncia como región con ese nombre. */
@Component({
  selector: 'nt-aviso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nota',
    '[class.wa]': 'advertencia()',
    '[attr.role]': 'etiqueta() ? "region" : null',
    '[attr.aria-label]': 'etiqueta() || null',
  },
  template: '<ng-content />',
})
export class NtAviso {
  readonly advertencia = input(false);
  readonly etiqueta = input('');
}

/** Estado vacío de Cristal (`.vac`): título y explicación. */
@Component({
  selector: 'nt-vacio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'vac' },
  template: `
    <h2>{{ titulo() }}</h2>
    <p>{{ texto() }}</p>
  `,
})
export class NtVacio {
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
}

/** Logo de nítido dibujado en línea con las variables de color (ver docs/logo-nitido.svg). */
@Component({
  selector: 'nt-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 120 120" aria-hidden="true">
      <path
        d="M14 40V24a10 10 0 0 1 10-10H40M80 14H96a10 10 0 0 1 10 10V40M106 80V96a10 10 0 0 1-10 10H80M40 106H24a10 10 0 0 1-10-10V80"
        [class]="enMenu() ? 'trazo menu' : 'trazo'"
      ></path>
      <circle cx="60" cy="60" r="19" class="punto"></circle>
      <circle cx="53" cy="53" r="5.5" class="brillo"></circle>
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .trazo {
      fill: none;
      stroke: var(--logo-bg);
      stroke-width: 11;
      stroke-linecap: round;
    }
    .trazo.menu {
      stroke: var(--side-logo-bg);
    }
    .punto {
      fill: var(--logo-dot);
    }
    .brillo {
      fill: var(--logo-shine);
      opacity: 0.85;
    }
  `,
})
export class NtLogo {
  readonly tamano = input(30);
  /** En el menú lateral el trazo usa `--side-logo-bg`. */
  readonly enMenu = input(false);
}
