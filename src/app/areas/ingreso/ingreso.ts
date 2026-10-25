import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';
import { NtAviso, NtBoton, NtCampo, NtLogo } from '../../compartido/componentes';
import { AutenticacionApi } from '../../nucleo/api/autenticacion.api';
import { InscripcionDeSegundoFactor } from '../../nucleo/api/modelos';
import { esHttp, mensajeDeError } from '../../nucleo/errores';
import { SesionServicio } from '../../nucleo/sesion.servicio';

type Paso = 'credenciales' | 'codigo' | 'inscripcion' | 'codigos';
type Documento = 'terminos' | 'politica';

export const MENSAJE_CORREO = 'Escribe un correo válido para ingresar.';
export const MENSAJE_CLAVE = 'Escribe tu contraseña para ingresar.';
export const MENSAJE_DEMASIADOS_INTENTOS = 'Hiciste muchos intentos seguidos. Espera un minuto y vuelve a intentarlo.';
export const MENSAJE_CODIGO_VACIO = 'Escribe el código para continuar.';

const RESUMENES: Record<Documento, { titulo: string; puntos: string[] }> = {
  terminos: {
    titulo: 'Términos de uso, resumen',
    puntos: [
      'Nítido propone asientos; el contador los revisa, aprueba y responde por la contabilidad.',
      'La firma es dueña de la información de sus clientes y puede exportarla cuando quiera.',
      'Los libros y documentos se conservan por 10 años, como exige la ley comercial.',
    ],
  },
  politica: {
    titulo: 'Política de tratamiento de datos, resumen',
    puntos: [
      'Nítido trata los datos como encargado de la firma contable, según la Ley 1581 de 2012.',
      'Los datos se usan solo para llevar la contabilidad de cada cliente.',
      'Los titulares pueden consultar, corregir o pedir la supresión de sus datos a través de la firma.',
    ],
  },
};

/** Pantalla de ingreso (F0-05b): correo y contraseña, código de la aplicación autenticadora o de recuperación, e inscripción. */
@Component({
  selector: 'nt-ingreso',
  templateUrl: './ingreso.html',
  styleUrl: './ingreso.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NtAviso, NtBoton, NtCampo, NtLogo],
})
export class Ingreso {
  private readonly api = inject(AutenticacionApi);
  private readonly sesion = inject(SesionServicio);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly paso = signal<Paso>('credenciales');
  protected readonly correo = signal('');
  protected readonly clave = signal('');
  protected readonly codigo = signal('');
  protected readonly error = signal('');
  protected readonly enviando = signal(false);
  protected readonly documento = signal<Documento | null>(null);
  protected readonly conRecuperacion = signal(false);
  protected readonly inscripcion = signal<InscripcionDeSegundoFactor | null>(null);
  protected readonly qr = signal('');
  protected readonly codigosDeRecuperacion = signal<string[]>([]);
  protected readonly codigosGuardados = signal(false);
  protected readonly copiado = signal(false);

  protected readonly resumen = computed(() => {
    const abierto = this.documento();
    return abierto ? RESUMENES[abierto] : null;
  });

  protected readonly claveEnGrupos = computed(
    () => this.inscripcion()?.claveManual.match(/.{1,4}/g)?.join(' ') ?? '',
  );

  protected alternarDocumento(documento: Documento): void {
    this.documento.update((actual) => (actual === documento ? null : documento));
  }

  protected editarCorreo(valor: string): void {
    this.correo.set(valor);
    this.error.set('');
  }

  protected editarClave(valor: string): void {
    this.clave.set(valor);
    this.error.set('');
  }

  protected editarCodigo(valor: string): void {
    this.codigo.set(valor);
    this.error.set('');
  }

  protected async ingresar(evento: Event): Promise<void> {
    evento.preventDefault();
    const correo = this.correo().trim();
    if (correo.indexOf('@') < 1) {
      this.error.set(MENSAJE_CORREO);
      return;
    }
    if (!this.clave()) {
      this.error.set(MENSAJE_CLAVE);
      return;
    }

    await this.enviar(async () => {
      const respuesta = await firstValueFrom(this.api.ingresar(correo, this.clave()));
      this.clave.set('');
      this.codigo.set('');
      if (respuesta.paso === 'inscribir-segundo-factor') {
        await this.prepararInscripcion();
      } else {
        this.paso.set('codigo');
      }
    }, true);
  }

  protected async confirmarCodigo(evento: Event): Promise<void> {
    evento.preventDefault();
    const codigo = this.codigo().trim();
    if (!codigo) {
      this.error.set(MENSAJE_CODIGO_VACIO);
      return;
    }

    await this.enviar(async () => {
      await firstValueFrom(
        this.conRecuperacion() ? this.api.usarCodigoDeRecuperacion(codigo) : this.api.verificarCodigo(codigo),
      );
      await this.terminar();
    });
  }

  protected async activar(evento: Event): Promise<void> {
    evento.preventDefault();
    const codigo = this.codigo().trim();
    if (!codigo) {
      this.error.set(MENSAJE_CODIGO_VACIO);
      return;
    }

    await this.enviar(async () => {
      const respuesta = await firstValueFrom(this.api.confirmarInscripcion(codigo));
      this.codigosDeRecuperacion.set(respuesta.codigosRecuperacion);
      this.codigo.set('');
      this.paso.set('codigos');
    });
  }

  protected alternarRecuperacion(): void {
    this.conRecuperacion.update((valor) => !valor);
    this.codigo.set('');
    this.error.set('');
  }

  protected async continuar(): Promise<void> {
    await this.enviar(() => this.terminar());
  }

  protected async copiar(): Promise<void> {
    await navigator.clipboard.writeText(this.codigosDeRecuperacion().join('\n'));
    this.copiado.set(true);
  }

  protected descargar(): void {
    const archivo = new Blob([`${this.codigosDeRecuperacion().join('\n')}\n`], { type: 'text/plain' });
    const direccion = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = direccion;
    enlace.download = 'codigos-recuperacion-nitido.txt';
    enlace.click();
    URL.revokeObjectURL(direccion);
  }

  private async prepararInscripcion(): Promise<void> {
    const inscripcion = await firstValueFrom(this.api.inscripcion());
    this.inscripcion.set(inscripcion);
    // El código QR se dibuja aquí, en el navegador: un servicio externo de QR vería el secreto.
    const estilos = getComputedStyle(document.documentElement);
    this.qr.set(
      await QRCode.toDataURL(inscripcion.uriOtpauth, {
        margin: 1,
        width: 192,
        color: {
          dark: estilos.getPropertyValue('--qr-trazo').trim(),
          light: estilos.getPropertyValue('--qr-fondo').trim(),
        },
      }),
    );
    this.paso.set('inscripcion');
  }

  /** Con la sesión completa, carga el perfil y va a donde la persona quería entrar. */
  private async terminar(): Promise<void> {
    await this.sesion.cargar();
    const destino = this.ruta.snapshot.queryParamMap.get('volver');
    await this.router.navigateByUrl(destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/clientes');
  }

  private async enviar(accion: () => Promise<void>, esIngreso = false): Promise<void> {
    this.enviando.set(true);
    this.error.set('');
    try {
      await accion();
    } catch (error) {
      this.error.set(esHttp(error, 429) ? MENSAJE_DEMASIADOS_INTENTOS : mensajeDeError(error));
      if (esIngreso) {
        this.clave.set('');
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
