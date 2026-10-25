import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NtBoton, NtBusqueda, NtCampo, NtEstado, NtVacio } from '../../compartido/componentes';
import { NtAreaTrabajo } from '../../compartido/estructura';
import { formatearMesYAnio, formatearNit, nombreDelMes } from '../../compartido/formato';
import { ToastServicio } from '../../compartido/toast';
import { ClientesApi } from '../../nucleo/api/clientes.api';
import { Cliente } from '../../nucleo/api/modelos';
import { mensajeDeError } from '../../nucleo/errores';

export const MENSAJE_RAZON_SOCIAL = 'Escribe la razón social o el nombre del cliente.';
export const MENSAJE_DOCUMENTO = 'Escribe el NIT o la cédula del cliente.';

/** Quita mayúsculas, puntos y guiones, para que «800.197» y «800197» encuentren lo mismo. */
export function normalizarBusqueda(texto: string): string {
  return texto.trim().toLowerCase().replace(/[.\-\s]/g, '');
}

/** Filtra en el navegador por razón social o por número de documento (con o sin dígito de verificación). */
export function filtrarClientes(clientes: Cliente[], texto: string): Cliente[] {
  const buscado = normalizarBusqueda(texto);
  if (!buscado) {
    return clientes;
  }
  return clientes.filter(
    (c) =>
      normalizarBusqueda(c.razonSocial).includes(buscado) ||
      c.numeroDocumento.includes(buscado) ||
      `${c.numeroDocumento}${c.digitoVerificacion}`.includes(buscado),
  );
}

/** Pantalla de Clientes (F0-05c): lista, búsqueda en el navegador y formulario para agregar. */
@Component({
  selector: 'nt-clientes',
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NtAreaTrabajo, NtBoton, NtBusqueda, NtCampo, NtEstado, NtVacio],
})
export class Clientes implements OnInit {
  private readonly api = inject(ClientesApi);
  private readonly toast = inject(ToastServicio);
  private readonly hoy = new Date();

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorDeCarga = signal('');
  protected readonly busqueda = signal('');
  protected readonly formularioAbierto = signal(false);
  protected readonly razonSocial = signal('');
  protected readonly documento = signal('');
  protected readonly errorDelFormulario = signal('');
  protected readonly guardando = signal(false);

  protected readonly mesEnCurso = nombreDelMes(this.hoy);

  protected readonly filas = computed(() =>
    filtrarClientes(this.clientes(), this.busqueda()).sort((a, b) =>
      a.razonSocial.localeCompare(b.razonSocial, 'es-CO'),
    ),
  );

  protected readonly resumen = computed(() => {
    const total = this.clientes().length;
    return `${formatearMesYAnio(this.hoy)}. ${total} ${total === 1 ? 'cliente' : 'clientes'}.`;
  });

  async ngOnInit(): Promise<void> {
    try {
      this.clientes.set(await firstValueFrom(this.api.listar()));
    } catch (error) {
      this.errorDeCarga.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected documentoDe(cliente: Cliente): string {
    return formatearNit(cliente.numeroDocumento, cliente.digitoVerificacion);
  }

  protected abrirFormulario(): void {
    this.razonSocial.set('');
    this.documento.set('');
    this.errorDelFormulario.set('');
    this.formularioAbierto.set(true);
  }

  protected cerrarFormulario(): void {
    this.formularioAbierto.set(false);
  }

  protected editarRazonSocial(valor: string): void {
    this.razonSocial.set(valor);
    this.errorDelFormulario.set('');
  }

  protected editarDocumento(valor: string): void {
    this.documento.set(valor);
    this.errorDelFormulario.set('');
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    const razonSocial = this.razonSocial().trim();
    if (!razonSocial) {
      this.errorDelFormulario.set(MENSAJE_RAZON_SOCIAL);
      return;
    }
    if (!this.documento().trim()) {
      this.errorDelFormulario.set(MENSAJE_DOCUMENTO);
      return;
    }

    this.guardando.set(true);
    try {
      const creado = await firstValueFrom(this.api.crear(razonSocial, this.documento().trim()));
      this.clientes.update((lista) => [...lista, creado]);
      this.formularioAbierto.set(false);
      this.toast.mostrar(`${creado.razonSocial} agregado`);
    } catch (error) {
      this.errorDelFormulario.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
