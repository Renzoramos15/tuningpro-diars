import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { LoginComponent } from './features/auth/login.component';
import { rutaInicial } from './core/guards/rol.guard';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  menu: { ruta: string; texto: string }[] = [];

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.logueado) this.prepararMenu();
  }

  // ---------- Permisos para la interfaz (deben coincidir con los de la API) ----------
  get esPersonal(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar', 'Recepcionista'); }
  get verInventario(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar'); }
  get verProyectos(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista'); }
  get verOrdenes(): boolean { return this.auth.puede('Administrador', 'Recepcionista'); }
  get verHistorial(): boolean { return this.verProyectos; }
  get verReportes(): boolean { return this.auth.puede('Administrador'); }
  get verGestion(): boolean { return this.esPersonal; }

  // ---------- Menú y sesión ----------
  private prepararMenu() {
    const todas = [
      { ruta: 'inventario', texto: '📦 Inventario', ver: this.verInventario },
      { ruta: 'proyectos', texto: '🛠 Proyectos', ver: this.verProyectos },
      { ruta: 'ordenes', texto: '🧾 Órdenes de trabajo', ver: this.verOrdenes },
      { ruta: 'historial', texto: '🚗 Historial técnico', ver: this.verHistorial },
      { ruta: 'reportes', texto: '📄 Reportes', ver: this.verReportes },
      { ruta: 'gestion', texto: '⚙ Gestión de datos', ver: this.verGestion }
    ];
    this.menu = todas.filter(t => t.ver).map(t => ({ ruta: t.ruta, texto: t.texto }));
  }

  alIngresar() {
    this.prepararMenu();
    this.router.navigateByUrl(rutaInicial(this.auth));
  }

  cerrarSesion() {
    this.auth.logout();
    this.menu = [];
    this.router.navigateByUrl('/');
  }
}