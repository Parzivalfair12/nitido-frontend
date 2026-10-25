import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Cliente } from '../../nucleo/api/modelos';
import { ToastServicio } from '../../compartido/toast';
import { Clientes, filtrarClientes, normalizarBusqueda } from './clientes';

const acme: Cliente = {
  uuid: '1',
  tipoDocumento: '31',
  numeroDocumento: '800197268',
  digitoVerificacion: '4',
  razonSocial: 'Acme S.A.S.',
  activo: true,
};
const bancolombia: Cliente = {
  uuid: '2',
  tipoDocumento: '31',
  numeroDocumento: '890903938',
  digitoVerificacion: '8',
  razonSocial: 'Bancolombia',
  activo: true,
};

describe('búsqueda de clientes', () => {
  it('ignora mayúsculas, puntos y guion', () => {
    expect(normalizarBusqueda(' 800.197-268 ')).toBe('800197268');
    expect(normalizarBusqueda('Acme S.A.S.')).toBe('acmesas');
  });

  it('«800.197» y «800197» encuentran lo mismo, por documento o por nombre', () => {
    const lista = [acme, bancolombia];
    expect(filtrarClientes(lista, '800.197')).toEqual([acme]);
    expect(filtrarClientes(lista, '800197')).toEqual([acme]);
    expect(filtrarClientes(lista, '800197268-4')).toEqual([acme]);
    expect(filtrarClientes(lista, 'BANCO')).toEqual([bancolombia]);
    expect(filtrarClientes(lista, '')).toEqual(lista);
    expect(filtrarClientes(lista, 'zzz')).toEqual([]);
  });
});

describe('pantalla de clientes', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  async function abrir(clientes: Cliente[]) {
    const fixture = TestBed.createComponent(Clientes);
    fixture.detectChanges();
    http.expectOne('/api/clientes').flush(clientes);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('muestra el resumen en singular y plural y la fila con el NIT formateado', async () => {
    const { raiz } = await abrir([acme]);
    expect(raiz.querySelector('.hd p')?.textContent).toMatch(/^[A-Z][a-zé]+ \d{4}\. 1 cliente\.$/);
    expect(raiz.textContent).toContain('NIT 800.197.268-4');
    expect(raiz.querySelectorAll('[role="row"]').length).toBe(2); // encabezado + una fila
  });

  it('con lista vacía muestra «Aún no tienes clientes»', async () => {
    const { raiz } = await abrir([]);
    expect(raiz.querySelector('nt-vacio h2')?.textContent).toBe('Aún no tienes clientes');
    expect(raiz.querySelector('nt-vacio p')?.textContent).toBe('Agrega el primero con el botón Agregar cliente.');
  });

  it('valida en pantalla antes de llamar a la API', async () => {
    const { fixture, raiz } = await abrir([acme]);
    (raiz.querySelector('button.pr') as HTMLButtonElement).click();
    fixture.detectChanges();
    const formulario = raiz.querySelector('form') as HTMLFormElement;
    formulario.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe('Escribe la razón social o el nombre del cliente.');

    const razon = raiz.querySelector('#razon-social') as HTMLInputElement;
    razon.value = 'Nueva S.A.S.';
    razon.dispatchEvent(new Event('input'));
    formulario.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe('Escribe el NIT o la cédula del cliente.');
    http.expectNone('/api/clientes');
  });

  it('al guardar cierra el formulario, agrega la fila y avisa con el toast', async () => {
    const { fixture, raiz } = await abrir([acme]);
    const toast = TestBed.inject(ToastServicio);
    (raiz.querySelector('button.pr') as HTMLButtonElement).click();
    fixture.detectChanges();
    const razon = raiz.querySelector('#razon-social') as HTMLInputElement;
    razon.value = 'Bancolombia';
    razon.dispatchEvent(new Event('input'));
    const documento = raiz.querySelector('#documento') as HTMLInputElement;
    documento.value = '890.903.938';
    documento.dispatchEvent(new Event('input'));
    (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    const peticion = http.expectOne('/api/clientes');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ razonSocial: 'Bancolombia', numeroDocumento: '890.903.938' });
    peticion.flush(bancolombia);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(raiz.querySelector('form')).toBeNull();
    expect(raiz.textContent).toContain('NIT 890.903.938-8');
    expect(toast.mensaje()).toBe('Bancolombia agregado');
    toast.cerrar();
  });

  it('muestra el título de la API cuando rechaza el cliente', async () => {
    const { fixture, raiz } = await abrir([]);
    (raiz.querySelector('button.pr') as HTMLButtonElement).click();
    fixture.detectChanges();
    const razon = raiz.querySelector('#razon-social') as HTMLInputElement;
    razon.value = 'Acme';
    razon.dispatchEvent(new Event('input'));
    const documento = raiz.querySelector('#documento') as HTMLInputElement;
    documento.value = '800197268';
    documento.dispatchEvent(new Event('input'));
    (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    http.expectOne('/api/clientes').flush(
      { title: 'Este cliente ya está en tu firma.', status: 409 },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe('Este cliente ya está en tu firma.');
    expect(raiz.querySelector('form')).not.toBeNull();
  });
});
