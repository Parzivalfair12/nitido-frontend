import { Routes } from '@angular/router';
import { autenticada, sinSesion } from './nucleo/guardias';

export const routes: Routes = [
  {
    path: 'ingreso',
    title: 'Ingresa a tu cuenta · nítido',
    canActivate: [sinSesion],
    loadComponent: () => import('./areas/ingreso/ingreso').then((m) => m.Ingreso),
  },
  {
    path: '',
    canActivate: [autenticada],
    loadComponent: () => import('./areas/estructura/estructura').then((m) => m.Estructura),
    children: [
      {
        path: 'clientes',
        title: 'Clientes · nítido',
        loadComponent: () => import('./areas/clientes/clientes').then((m) => m.Clientes),
      },
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
    ],
  },
  { path: '**', redirectTo: '' },
];
