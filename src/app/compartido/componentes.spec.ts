import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NtAviso, NtBoton, NtBusqueda, NtCampo, NtEstado, NtVacio } from './componentes';

@Component({
  imports: [NtAviso, NtBoton, NtBusqueda, NtCampo, NtEstado, NtVacio],
  template: `
    <button ntBoton variante="principal" id="principal">Guardar</button>
    <button ntBoton id="secundario">Cancelar</button>
    <button ntBoton variante="peligro" id="peligro">Rechazar</button>
    <button ntBoton variante="fantasma" [grande]="true" id="fantasma">Salir</button>
    <nt-campo idCampo="correo" etiqueta="Correo" [error]="error()" [(valor)]="correo" />
    <nt-busqueda etiqueta="Buscar por nombre o NIT" [(valor)]="busqueda" />
    <nt-estado color="wa">Por revisar</nt-estado>
    <nt-aviso etiqueta="Resumen" [advertencia]="true">Texto</nt-aviso>
    <nt-vacio titulo="Aún no tienes clientes" texto="Agrega el primero." />
  `,
})
class Anfitrion {
  readonly error = signal('');
  readonly correo = signal('');
  readonly busqueda = signal('');
}

describe('componentes de Cristal', () => {
  function crear() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('el botón principal usa .bt.pr y los demás sus variantes', () => {
    const { raiz } = crear();
    expect(raiz.querySelector('#principal')?.className).toContain('bt');
    expect(raiz.querySelector('#principal')?.classList.contains('pr')).toBe(true);
    expect(raiz.querySelector('#secundario')?.classList.contains('pr')).toBe(false);
    expect(raiz.querySelector('#peligro')?.classList.contains('tx')).toBe(true);
    expect(raiz.querySelector('#fantasma')?.classList.contains('gh')).toBe(true);
    expect(raiz.querySelector('#fantasma')?.classList.contains('grande')).toBe(true);
  });

  it('el campo asocia la etiqueta con el input y muestra el error con role="alert"', () => {
    const { fixture, raiz } = crear();
    const etiqueta = raiz.querySelector('nt-campo label') as HTMLLabelElement;
    expect(etiqueta.htmlFor).toBe('correo');
    expect(raiz.querySelector('nt-campo input#correo.in')).not.toBeNull();
    expect(raiz.querySelector('nt-campo [role="alert"]')).toBeNull();

    fixture.componentInstance.error.set('Escribe un correo válido para ingresar.');
    fixture.detectChanges();
    const alerta = raiz.querySelector('nt-campo [role="alert"]');
    expect(alerta?.textContent).toContain('Escribe un correo válido para ingresar.');
    expect(raiz.querySelector('nt-campo input')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('el campo y la búsqueda actualizan su valor mientras se escribe', () => {
    const { fixture, raiz } = crear();
    const campo = raiz.querySelector('nt-campo input') as HTMLInputElement;
    campo.value = 'ana@ejemplo.co';
    campo.dispatchEvent(new Event('input'));
    const busqueda = raiz.querySelector('nt-busqueda input') as HTMLInputElement;
    busqueda.value = '800.197';
    busqueda.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.correo()).toBe('ana@ejemplo.co');
    expect(fixture.componentInstance.busqueda()).toBe('800.197');
    expect(busqueda.getAttribute('aria-label')).toBe('Buscar por nombre o NIT');
    expect(busqueda.type).toBe('search');
  });

  it('el estado dibuja el punto de color y el texto', () => {
    const { raiz } = crear();
    const punto = raiz.querySelector('nt-estado i.pt');
    expect(punto?.classList.contains('wa')).toBe(true);
    expect(raiz.querySelector('nt-estado')?.textContent).toContain('Por revisar');
  });

  it('el aviso es una región con nombre y puede ser de advertencia', () => {
    const { raiz } = crear();
    const aviso = raiz.querySelector('nt-aviso') as HTMLElement;
    expect(aviso.classList.contains('nota')).toBe(true);
    expect(aviso.classList.contains('wa')).toBe(true);
    expect(aviso.getAttribute('role')).toBe('region');
    expect(aviso.getAttribute('aria-label')).toBe('Resumen');
  });

  it('el estado vacío muestra título y texto', () => {
    const { raiz } = crear();
    expect(raiz.querySelector('nt-vacio h2')?.textContent).toBe('Aún no tienes clientes');
    expect(raiz.querySelector('nt-vacio p')?.textContent).toBe('Agrega el primero.');
  });
});
