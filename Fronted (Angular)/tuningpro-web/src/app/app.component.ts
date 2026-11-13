import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PiezasService } from './core/piezas.service';
import { Pieza, Proyecto, Vehiculo } from './core/models';
import { AuthService } from './core/auth.service';
import { LoginComponent } from './features/auth/login.component';
import { PortalComponent } from './features/portal/portal.component';
import { OrdenesComponent } from './features/proyectos/ordenes.component';
import { HistorialComponent } from './features/vehiculos/historial.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { GestionComponent } from './features/gestion/gestion.component';

type Vista = 'inventario' | 'proyectos' | 'ordenes' | 'historial' | 'reportes' | 'gestion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginComponent, PortalComponent, OrdenesComponent,
            HistorialComponent, ReportesComponent, GestionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  piezas: Pieza[] = [];
  proyectos: Proyecto[] = [];
  alertasIds = new Set<number>();

  mensaje = '';
  esError = false;

  // Menú según el rol
  menu: { id: Vista; texto: string }[] = [];
  vista: Vista = 'inventario';

  vehiculoValidarId = 1;
  entradas: Record<number, number> = {};

  nuevoNombre = '';
  nuevoVehiculoId = 1;

  asignacion: { proyectoId: number | null; piezaId: number | null; cantidad: number } = {
    proyectoId: null, piezaId: null, cantidad: 1
  };

  transiciones: Record<string, string[]> = {};
  nuevoEstado: Record<number, string> = {};

  constructor(private service: PiezasService, public auth: AuthService) {}

  ngOnInit() {
    if (this.auth.logueado) this.cargarTodo();
  }

  // ---------- Permisos para la interfaz (deben coincidir con los de la API) ----------
  get esPersonal(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar', 'Recepcionista'); }
  get verInventario(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar'); }
  get puedeValidar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }
  get puedeEntradas(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }
  get verProyectos(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista'); }
  get puedeCrearProyecto(): boolean { return this.verProyectos; }
  get puedeAsignar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }
  get puedeFinalizar(): boolean { return this.puedeAsignar; }
  get verOrdenes(): boolean { return this.auth.puede('Administrador', 'Recepcionista'); }
  get verHistorial(): boolean { return this.verProyectos; }
  get verReportes(): boolean { return this.auth.puede('Administrador'); }
  get verGestion(): boolean { return this.esPersonal; }

  // ---------- Menú y sesión ----------
  private prepararMenu() {
    const todas: { id: Vista; texto: string; ver: boolean }[] = [
      { id: 'inventario', texto: '📦 Inventario', ver: this.verInventario },
      { id: 'proyectos', texto: '🛠 Proyectos', ver: this.verProyectos },
      { id: 'ordenes', texto: '🧾 Órdenes de trabajo', ver: this.verOrdenes },
      { id: 'historial', texto: '🚗 Historial técnico', ver: this.verHistorial },
      { id: 'reportes', texto: '📄 Reportes', ver: this.verReportes },
      { id: 'gestion', texto: '⚙ Gestión de datos', ver: this.verGestion }
    ];
    this.menu = todas.filter(t => t.ver).map(t => ({ id: t.id, texto: t.texto }));
    if (!this.menu.some(m => m.id === this.vista)) {
      this.vista = this.menu.length ? this.menu[0].id : 'inventario';
    }
  }

  irA(v: Vista) {
    this.vista = v;
    this.mensaje = '';
  }

  cerrarSesion() {
    this.auth.logout();
    this.vehiculos = []; this.piezas = []; this.proyectos = [];
    this.alertasIds = new Set();
    this.transiciones = {}; this.nuevoEstado = {};
    this.menu = [];
    this.mensaje = '';
  }

  // ---------- Carga de datos (solo lo que el rol puede ver) ----------
  cargarTodo() {
    this.mensaje = '';
    this.prepararMenu();
    if (!this.esPersonal) return;

    if (this.verProyectos) {
      this.service.getVehiculos().subscribe({
        next: v => {
          this.vehiculos = v;
          if (v.length) {
            this.vehiculoValidarId = v[0].id;
            this.nuevoVehiculoId = v[0].id;
          }
        },
        error: e => this.manejarError(e, 'No se pudo conectar con la API.')
      });
      this.recargarProyectos();
    }

    if (this.verInventario) this.recargarInventario();

    if (this.puedeFinalizar) {
      this.service.getTransiciones().subscribe({ next: t => (this.transiciones = t) });
    }
  }

  recargarInventario() {
    this.service.getPiezas().subscribe({
      next: p => {
        this.piezas = p;
        if (this.asignacion.piezaId == null && p.length) this.asignacion.piezaId = p[0].id;
      },
      error: e => this.manejarError(e, 'No se pudo conectar con la API.')
    });
    this.service.getAlertas().subscribe({
      next: a => (this.alertasIds = new Set(a.map(x => x.id)))
    });
  }

  recargarProyectos() {
    this.service.getProyectos().subscribe({
      next: p => {
        this.proyectos = p;
        p.forEach(x => { if (this.nuevoEstado[x.id] === undefined) this.nuevoEstado[x.id] = ''; });

        const abiertos = this.proyectosAbiertos;
        if (!abiertos.some(x => x.id === this.asignacion.proyectoId)) {
          this.asignacion.proyectoId = abiertos.length ? abiertos[0].id : null;
        }
      },
      error: e => this.manejarError(e, 'No se pudieron cargar los proyectos.')
    });
  }

  // Se llama cuando el personal registra algo en "Gestión de datos"
  recargarMaestros() {
    if (this.verProyectos) this.service.getVehiculos().subscribe({ next: v => (this.vehiculos = v) });
    if (this.verInventario) this.recargarInventario();
  }

  // ---------- Compatibilidad ----------
  validar(piezaId: number) {
    this.service.validar(Number(this.vehiculoValidarId), piezaId).subscribe({
      next: r => this.mostrar(r.mensaje, !r.esCompatible),
      error: e => this.manejarError(e, 'Error al validar.')
    });
  }

  // ---------- Inventario ----------
  registrarEntrada(p: Pieza) {
    const cantidad = Number(this.entradas[p.id] ?? 0);
    if (cantidad < 1) {
      this.mostrar('Escribe una cantidad mayor a 0 para registrar la entrada.', true);
      return;
    }
    this.service.movimiento(p.id, cantidad, true).subscribe({
      next: () => {
        this.entradas[p.id] = 0;
        this.mostrar(`Entrada registrada: +${cantidad} de "${p.nombre}".`, false);
        this.recargarInventario();
      },
      error: e => this.manejarError(e, 'No se pudo registrar la entrada.')
    });
  }

  esStockBajo(p: Pieza): boolean {
    return this.alertasIds.has(p.id);
  }

  // ---------- Proyectos ----------
  crearProyecto() {
    const nombre = this.nuevoNombre.trim();
    if (!nombre) {
      this.mostrar('Escribe un nombre para el proyecto.', true);
      return;
    }
    this.service.crearProyecto(nombre, Number(this.nuevoVehiculoId)).subscribe({
      next: p => {
        this.nuevoNombre = '';
        this.asignacion.proyectoId = p.id;
        this.mostrar(`Proyecto "${p.nombre}" creado (N° ${p.id}).`, false);
        this.recargarProyectos();
      },
      error: e => this.manejarError(e, 'No se pudo crear el proyecto.')
    });
  }

  asignarPieza() {
    const { proyectoId, piezaId, cantidad } = this.asignacion;
    if (proyectoId == null || piezaId == null || Number(cantidad) < 1) {
      this.mostrar('Selecciona proyecto, pieza y una cantidad válida.', true);
      return;
    }
    this.service.asignarPieza(proyectoId, piezaId, Number(cantidad)).subscribe({
      next: () => {
        this.mostrar('Pieza asignada al proyecto. Stock actualizado.', false);
        this.recargarInventario();
        this.recargarProyectos();
      },
      error: e => this.manejarError(e, 'No se pudo asignar la pieza.')
    });
  }

  // Proyectos que todavía admiten piezas
  get proyectosAbiertos(): Proyecto[] {
    return this.proyectos.filter(p => p.estado === 'Registrado' || p.estado === 'En proceso');
  }

  opcionesEstado(p: Proyecto): string[] {
    return this.transiciones[p.estado] ?? [];
  }

  cambiarEstado(p: Proyecto) {
    const estado = this.nuevoEstado[p.id];
    if (!estado) {
      this.mostrar('Elige el nuevo estado del proyecto.', true);
      return;
    }

    if (estado === 'Cancelado' || estado === 'Rechazado') {
      const aviso = p.detalles.length > 0 ? ' Las piezas asignadas volverán al inventario.' : '';
      if (!confirm(`¿Marcar el proyecto "${p.nombre}" como ${estado.toLowerCase()}?${aviso}`)) return;
    }

    this.service.cambiarEstado(p.id, estado).subscribe({
      next: () => {
        this.nuevoEstado[p.id] = '';
        this.mostrar(`Proyecto "${p.nombre}": ahora está ${estado.toLowerCase()}.`, false);
        this.recargarProyectos();
        this.recargarInventario();
      },
      error: e => this.manejarError(e, 'No se pudo cambiar el estado.')
    });
  }

  // ---------- Ayudas de presentación ----------
  textoVehiculo(id: number): string {
    const v = this.vehiculos.find(x => x.id === id);
    return v ? `${v.marca} ${v.modelo} (${v.placa})` : `Vehículo #${id}`;
  }

  totalProyecto(p: Proyecto): number {
    return p.detalles.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }

  private manejarError(err: any, porDefecto: string) {
    if (err?.status === 0) {
      this.mostrar('No se pudo conectar con la API. ¿Está corriendo?', true);
    } else if (err?.status === 403) {
      this.mostrar('Tu rol no tiene permiso para realizar esta acción.', true);
    } else if (err?.status === 401) {
      this.mostrar('Tu sesión expiró. Inicia sesión de nuevo.', true);
    } else {
      this.mostrar(err?.error?.mensaje ?? porDefecto, true);
    }
  }
}