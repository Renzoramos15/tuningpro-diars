import { Routes } from '@angular/router';
import { MenuLayoutComponent } from './menu/menu-layout/menu-layout.component';
import { LoginComponent } from './login.component';
import { PortalComponent } from './portal.component';
import { OrdenesComponent } from './ordenes.component';
import { HistorialComponent } from './historial.component';
import { ReportesComponent } from './reportes.component';
import { GestionComponent } from './gestion.component';
import { ProyectoListComponent } from './proyecto/proyecto-list/proyecto-list.component';
import { authGuard, soloInvitadoGuard } from './auth.guard';
import { ProyectoNuevoComponent } from './proyecto/proyecto-nuevo/proyecto-nuevo.component';
import { ProyectoDetalleComponent } from './proyecto/proyecto-detalle/proyecto-detalle.component';
import { OtNuevaComponent } from "./ot/ot-nueva/ot-nueva.component";
export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [soloInvitadoGuard] },
  {
    path: '',
    component: MenuLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'proyectos', pathMatch: 'full' },
      { path: 'proyectos', component: ProyectoListComponent },
      { path: 'ordenes-trabajo', component: OrdenesComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: 'gestion', component: GestionComponent },
      { path: 'portal', component: PortalComponent },
      { path: 'proyectos/nuevo', component: ProyectoNuevoComponent },
      { path: 'proyectos/:id', component: ProyectoDetalleComponent },
      { path: 'ordenes-trabajo/nueva/:proyectoId', component: OtNuevaComponent },
      // 'inventario' lo agregamos en el siguiente paso, cuando lo saquemos de app.component.ts
    ]
  },
  { path: '**', redirectTo: '' }
];