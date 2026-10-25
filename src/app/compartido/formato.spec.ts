import {
  formatearFechaCorta,
  formatearFechaLarga,
  formatearMesYAnio,
  formatearMonto,
  formatearNit,
  iniciales,
  nombreDelMes,
} from './formato';

describe('formato es-CO', () => {
  it('formatea montos con signo menos tipográfico', () => {
    expect(formatearMonto(-1234567.5)).toBe('−1.234.567,50');
    expect(formatearMonto(1234567.5)).toBe('1.234.567,50');
    expect(formatearMonto(0)).toBe('0,00');
  });

  it('formatea fechas cortas y largas', () => {
    const fecha = new Date(2026, 9, 12);
    expect(formatearFechaCorta(fecha)).toBe('12 oct');
    expect(formatearFechaLarga(fecha)).toBe('12 de octubre de 2026');
  });

  it('formatea el mes en curso', () => {
    const fecha = new Date(2026, 9, 12);
    expect(nombreDelMes(fecha)).toBe('octubre');
    expect(formatearMesYAnio(fecha)).toBe('Octubre 2026');
  });

  it('formatea el NIT con puntos y dígito de verificación', () => {
    expect(formatearNit('800197268', '4')).toBe('NIT 800.197.268-4');
    expect(formatearNit('890903938', '8')).toBe('NIT 890.903.938-8');
  });

  it('saca las iniciales del nombre', () => {
    expect(iniciales('Ana Pérez')).toBe('AP');
    expect(iniciales('  ana   maría  gómez ')).toBe('AG');
    expect(iniciales('Andrés')).toBe('AN');
    expect(iniciales('')).toBe('');
  });
});
