import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from './core/auth.service';
import { rolGuard, rutaInicial } from './core/guards/rol.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => rutaInicial(inject(AuthService)) },
  {
    path: 'portal',
    canActivate: [rolGuard],
    data: { roles: ['Cliente'] },
    loadComponent: () => import('./features/portal/portal.component').then(m => m.PortalComponent)
  },
  {
    path: 'inventario',
    canActivate: [rolGuard],
    data: { roles: ['Administrador', 'Tecnico', 'Auxiliar'] },
    loadComponent: () => import('./features/inventario/inventario.component').then(m => m.InventarioComponent)
  },
  {
    path: 'proyectos',
    canActivate: [rolGuard],
    data: { roles: ['Administrador', 'Tecnico', 'Recepcionista'] },
    loadComponent: () => import('./features/proyectos/proyectos.component').then(m => m.ProyectosComponent)
  },
  {
    path: 'ordenes',
    canActivate: [rolGuard],
    data: { roles: ['Administrador', 'Recepcionista'] },
    loadComponent: () => import('./features/proyectos/ordenes.component').then(m => m.OrdenesComponent)
  },
  {
    path: 'historial',
    canActivate: [rolGuard],
    data: { roles: ['Administrador', 'Tecnico', 'Recepcionista'] },
    loadComponent: () => import('./features/vehiculos/historial.component').then(m => m.HistorialComponent)
  },
  {
    path: 'reportes',
    canActivate: [rolGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: 'gestion',
    canActivate: [rolGuard],
    data: { roles: ['Administrador', 'Tecnico', 'Auxiliar', 'Recepcionista'] },
    loadComponent: () => import('./features/gestion/gestion.component').then(m => m.GestionComponent)
  },
  { path: '**', redirectTo: '' }
];