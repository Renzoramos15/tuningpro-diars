import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth.service';

interface ItemMenu {
  ruta: string;
  texto: string;
  icono: 'inventario' | 'proyectos' | 'ordenes' | 'historial' | 'reportes' | 'gestion';
  ver: boolean;
}

@Component({
  selector: 'app-menu-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './menu-layout.component.html',
  styleUrl: './menu-layout.component.css'
})
export class MenuLayoutComponent {
  isSidebarOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  get verInventario() { return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar'); }
  get verProyectos()  { return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista'); }
  get verOrdenes()    { return this.auth.puede('Administrador', 'Recepcionista'); }
  get verHistorial()  { return this.verProyectos; }
  get verReportes()   { return this.auth.puede('Administrador'); }
  get verGestion()    { return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar', 'Recepcionista'); }

  get itemsMenu(): ItemMenu[] {
    const todos: ItemMenu[] = [
      { ruta: '/inventario', texto: 'Inventario', icono: 'inventario', ver: this.verInventario },
      { ruta: '/proyectos', texto: 'Proyectos', icono: 'proyectos', ver: this.verProyectos },
      { ruta: '/ordenes-trabajo', texto: 'Órdenes de trabajo', icono: 'ordenes', ver: this.verOrdenes },
      { ruta: '/historial', texto: 'Historial técnico', icono: 'historial', ver: this.verHistorial },
      { ruta: '/reportes', texto: 'Reportes', icono: 'reportes', ver: this.verReportes },
      { ruta: '/gestion', texto: 'Gestión de datos', icono: 'gestion', ver: this.verGestion }
    ];
    return todos.filter(i => i.ver);
  }

  get nombreCompleto(): string {
    return this.auth.sesion?.nombreCompleto ?? '';
  }

  get rol(): string {
    return this.auth.rol;
  }

  get iniciales(): string {
    const partes = this.nombreCompleto.trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '';
    return partes.length === 1
      ? partes[0].slice(0, 2).toUpperCase()
      : (partes[0][0] + partes[1][0]).toUpperCase();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}