// Contrato de la API de nítido (OpenAPI en /openapi/v1.json del backend, solo en Development). Estos tipos reflejan
// los esquemas de ese documento; si cambia el contrato, cambian aquí.

export type PasoDeIngreso = 'inscribir-segundo-factor' | 'segundo-factor';

export interface RespuestaDeIngreso {
  paso: PasoDeIngreso;
}

export interface PerfilDeSesion {
  nombre: string;
  correo: string;
  rol: string;
  firma: string;
}

export interface InscripcionDeSegundoFactor {
  claveManual: string;
  uriOtpauth: string;
}

export interface CodigosDeRecuperacion {
  codigosRecuperacion: string[];
}

export interface Cliente {
  uuid: string;
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificacion: string;
  razonSocial: string;
  activo: boolean;
}

/** ProblemDetails (RFC 9457) de la API: el texto para la persona va en `title`; los errores por campo, en `errors`. */
export interface ProblemaDeApi {
  title?: string;
  status?: number;
  codigo?: string;
  errors?: Record<string, string[]>;
}
