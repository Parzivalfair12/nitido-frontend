import { formatNumber } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

// Estas pruebas usan la configuración REAL de la aplicación: el registro del
// locale y el proveedor LOCALE_ID vienen de app.config.ts, no de la prueba.
describe('formato-es-co (configuración real de la aplicación)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });

  it('la aplicación usa el locale es-CO', () => {
    expect(TestBed.inject(LOCALE_ID)).toBe('es-CO');
  });

  it('formatea 1234567.5 con separador de miles y coma decimal', () => {
    const locale = TestBed.inject(LOCALE_ID);
    expect(formatNumber(1234567.5, locale, '1.2-2')).toBe('1.234.567,50');
  });
});
