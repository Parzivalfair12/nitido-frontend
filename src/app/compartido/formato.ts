// Formato es-CO de números, fechas y documentos (regla 8: números y fechas con formato de Colombia).
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const FORMATO_MONTO = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Monto con separador de miles «.», decimales «,» y signo menos tipográfico: «−1.234.567,50». Solo para mostrar. */
export function formatearMonto(valor: number): string {
  const texto = FORMATO_MONTO.format(Math.abs(valor));
  return valor < 0 ? `−${texto}` : texto;
}

/** Fecha corta de tablas: «12 oct». */
export function formatearFechaCorta(fecha: Date): string {
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

/** Fecha larga de textos: «12 de octubre de 2026». */
export function formatearFechaLarga(fecha: Date): string {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** Nombre del mes en minúscula: «octubre». */
export function nombreDelMes(fecha: Date): string {
  return MESES[fecha.getMonth()];
}

/** Mes y año para encabezados: «Octubre 2026». */
export function formatearMesYAnio(fecha: Date): string {
  const mes = nombreDelMes(fecha);
  return `${mes[0].toUpperCase()}${mes.slice(1)} ${fecha.getFullYear()}`;
}

/** NIT con puntos y dígito de verificación: «NIT 800.197.268-4». */
export function formatearNit(numero: string, digitoVerificacion: string): string {
  return `NIT ${numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${digitoVerificacion}`;
}

/** Iniciales para el avatar: «Ana Pérez» → «AP». */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return '';
  }
  const letras = partes.length === 1 ? partes[0].slice(0, 2) : `${partes[0][0]}${partes[partes.length - 1][0]}`;
  return letras.toUpperCase();
}
