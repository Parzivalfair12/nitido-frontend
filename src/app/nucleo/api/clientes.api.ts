import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from './modelos';

/** Llamadas a /api/clientes. */
@Injectable({ providedIn: 'root' })
export class ClientesApi {
  private readonly http = inject(HttpClient);

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>('/api/clientes');
  }

  crear(razonSocial: string, numeroDocumento: string): Observable<Cliente> {
    return this.http.post<Cliente>('/api/clientes', { razonSocial, numeroDocumento });
  }
}
