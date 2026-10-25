import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Ingreso, MENSAJE_CLAVE, MENSAJE_CORREO, MENSAJE_DEMASIADOS_INTENTOS } from './ingreso';

describe('pantalla de ingreso', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  function abrir() {
    const fixture = TestBed.createComponent(Ingreso);
    fixture.detectChanges();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  function escribir(raiz: HTMLElement, selector: string, valor: string) {
    const campo = raiz.querySelector(selector) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function enviar(fixture: ReturnType<typeof abrir>['fixture'], raiz: HTMLElement) {
    (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('dibuja el ingreso del mockup, sin «¿La olvidaste?» ni «Mantener la sesión»', () => {
    const { raiz } = abrir();
    expect(raiz.querySelector('h1')?.textContent).toBe('Ingresa a tu cuenta');
    expect(raiz.textContent).toContain('Usa el correo con el que tu firma te dio acceso.');
    const correo = raiz.querySelector('#correo') as HTMLInputElement;
    expect(correo.type).toBe('email');
    expect(correo.getAttribute('autocomplete')).toBe('email');
    expect(correo.placeholder).toBe('nombre@tufirma.com');
    expect((raiz.querySelector('#clave') as HTMLInputElement).getAttribute('autocomplete')).toBe('current-password');
    expect(raiz.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Ingresar');
    expect(raiz.textContent).not.toContain('olvidaste');
    expect(raiz.textContent).not.toContain('Mantener la sesión');
    expect(raiz.textContent).toContain('¿Tu firma aún no usa Nítido? Solicita acceso');
    expect(raiz.querySelector('nt-aviso')).toBeNull();
  });

  it('cada enlace legal abre y cierra su aviso', () => {
    const { fixture, raiz } = abrir();
    const enlaces = raiz.querySelectorAll<HTMLButtonElement>('button.lk');
    enlaces[0].click();
    fixture.detectChanges();
    expect(raiz.querySelector('nt-aviso')?.getAttribute('role')).toBe('region');
    expect(raiz.querySelector('nt-aviso')?.getAttribute('aria-label')).toBe('Términos de uso, resumen');
    enlaces[1].click();
    fixture.detectChanges();
    expect(raiz.querySelector('nt-aviso')?.getAttribute('aria-label')).toBe('Política de tratamiento de datos, resumen');
    enlaces[1].click();
    fixture.detectChanges();
    expect(raiz.querySelector('nt-aviso')).toBeNull();
  });

  it('valida el correo y la contraseña en pantalla, sin llamar a la API', () => {
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'sin-arroba');
    enviar(fixture, raiz);
    expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe(MENSAJE_CORREO);

    escribir(raiz, '#correo', 'ana@ejemplo.co');
    enviar(fixture, raiz);
    expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe(MENSAJE_CLAVE);
    http.expectNone('/api/autenticacion/ingreso');
  });

  it('un 401 muestra el título del ProblemDetails', async () => {
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'ana@ejemplo.co');
    escribir(raiz, '#clave', 'una-clave-larga-123');
    enviar(fixture, raiz);

    http.expectOne('/api/autenticacion/ingreso').flush(
      { title: 'El correo o la contraseña no coinciden.', status: 401 },
      { status: 401, statusText: 'Unauthorized' },
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe('El correo o la contraseña no coinciden.');
    });
    expect((raiz.querySelector('#clave') as HTMLInputElement).value).toBe('');
  });

  it('un 429 muestra el aviso de demasiados intentos', async () => {
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'ana@ejemplo.co');
    escribir(raiz, '#clave', 'una-clave-larga-123');
    enviar(fixture, raiz);

    http.expectOne('/api/autenticacion/ingreso').flush(
      { title: 'otro texto', status: 429 },
      { status: 429, statusText: 'Too Many Requests' },
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe(MENSAJE_DEMASIADOS_INTENTOS);
    });
  });

  it('con segundo factor activo pide el código y permite cambiar al de recuperación', async () => {
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'ana@ejemplo.co');
    escribir(raiz, '#clave', 'una-clave-larga-123');
    enviar(fixture, raiz);
    http.expectOne('/api/autenticacion/ingreso').flush({ paso: 'segundo-factor' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(raiz.querySelector('h1')?.textContent).toBe('Confirma que eres tú');
    expect(raiz.textContent).toContain('Escribe el código de 6 dígitos de tu aplicación autenticadora.');
    const codigo = raiz.querySelector('#codigo') as HTMLInputElement;
    expect(codigo.getAttribute('inputmode')).toBe('numeric');
    expect(codigo.getAttribute('autocomplete')).toBe('one-time-code');
    expect(raiz.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Confirmar');

    (raiz.querySelector('button.alternar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(raiz.querySelector('label[for="codigo-recuperacion"]')?.textContent).toBe('Código de recuperación');
  });

  it('un código inválido muestra el mensaje de la API', async () => {
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'ana@ejemplo.co');
    escribir(raiz, '#clave', 'una-clave-larga-123');
    enviar(fixture, raiz);
    http.expectOne('/api/autenticacion/ingreso').flush({ paso: 'segundo-factor' });
    await fixture.whenStable();
    fixture.detectChanges();

    escribir(raiz, '#codigo', '000000');
    enviar(fixture, raiz);
    const mensaje = 'El código no es válido. Revisa que la hora de tu teléfono esté bien y vuelve a intentarlo.';
    http.expectOne('/api/autenticacion/segundo-factor').flush(
      { title: mensaje, status: 401 },
      { status: 401, statusText: 'Unauthorized' },
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(raiz.querySelector('form [role="alert"]')?.textContent).toBe(mensaje);
    });
  });

  it('sin segundo factor muestra la inscripción con la clave en grupos de 4 y luego los códigos', async () => {
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'ana@ejemplo.co');
    escribir(raiz, '#clave', 'una-clave-larga-123');
    enviar(fixture, raiz);
    http.expectOne('/api/autenticacion/ingreso').flush({ paso: 'inscribir-segundo-factor' });
    await vi.waitFor(() => http.expectOne('/api/autenticacion/segundo-factor/inscripcion'), { timeout: 2000 }).then((peticion) =>
      peticion.flush({
        claveManual: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        uriOtpauth: 'otpauth://totp/n%C3%ADtido:ana%40ejemplo.co?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=n%C3%ADtido',
      }),
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(raiz.querySelector('h1')?.textContent).toBe('Protege tu cuenta');
    });

    expect(raiz.querySelector('img.qr')?.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(raiz.textContent).toContain('¿No puedes escanearlo? Escribe esta clave:');
    expect(raiz.querySelector('.clave-manual')?.textContent).toBe('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP');
    expect(raiz.querySelector('button[type=submit]')?.textContent?.trim()).toBe('Activar');

    escribir(raiz, '#codigo', '123456');
    enviar(fixture, raiz);
    http.expectOne('/api/autenticacion/segundo-factor/inscripcion').flush({
      codigosRecuperacion: ['AAAAA-BBBBB', 'CCCCC-DDDDD'],
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(raiz.querySelector('h1')?.textContent).toBe('Guarda tus códigos de recuperación');
    });
    expect(raiz.querySelectorAll('.codigos li').length).toBe(2);
    const continuar = () =>
      Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Continuar') as HTMLButtonElement;
    expect(continuar().disabled).toBe(true);

    const marca = raiz.querySelector('.chk input') as HTMLInputElement;
    marca.checked = true;
    marca.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(continuar().disabled).toBe(false);
  });

  it('con el segundo factor confirmado va a /clientes', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const { fixture, raiz } = abrir();
    escribir(raiz, '#correo', 'ana@ejemplo.co');
    escribir(raiz, '#clave', 'una-clave-larga-123');
    enviar(fixture, raiz);
    http.expectOne('/api/autenticacion/ingreso').flush({ paso: 'segundo-factor' });
    await fixture.whenStable();
    fixture.detectChanges();

    escribir(raiz, '#codigo', '123456');
    enviar(fixture, raiz);
    http.expectOne('/api/autenticacion/segundo-factor').flush({ paso: 'completo' });
    await vi.waitFor(() =>
      http.expectOne('/api/autenticacion/yo').flush({ nombre: 'Ana Pérez', correo: 'ana@ejemplo.co', rol: 'ADMINISTRADOR', firma: 'F' }),
    );
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith('/clientes'));
  });
});
