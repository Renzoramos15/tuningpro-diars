import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from './core/auth.service';

// A dónde va cada rol al entrar (igual que el primer botón del menú actual)
export function rutaInicial(auth: AuthService): string {
  if (auth.puede('Cliente')) return '/portal';
  if (auth.puede('Administrador', 'Tecnico', 'Auxiliar')) return '/inventario';
  return '/proyectos'; // Recepcionista
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => rutaInicial(inject(AuthService)) },
  {
    path: 'portal',
    loadComponent: () => import('./features/portal/portal.component').then(m => m.PortalComponent)
  },
  {
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventario.component').then(m => m.InventarioComponent)
  },
  {
    path: 'proyectos',
    loadComponent: () => import('./features/proyectos/proyectos.component').then(m => m.ProyectosComponent)
  },
  {
    path: 'ordenes',
    loadComponent: () => import('./features/proyectos/ordenes.component').then(m => m.OrdenesComponent)
  },
  {
    path: 'historial',
    loadComponent: () => import('./features/vehiculos/historial.component').then(m => m.HistorialComponent)
  },
  {
    path: 'reportes',
    loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: 'gestion',
    loadComponent: () => import('./features/gestion/gestion.component').then(m => m.GestionComponent)
  },
  { path: '**', redirectTo: '' }
];