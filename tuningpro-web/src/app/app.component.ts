import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pieza, PiezasService, Proyecto, Vehiculo } from './piezas.service';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';
import { PortalComponent } from './portal.component';

@Component({
  selector: 'app-root',
  standalone: true,
imports: [CommonModule, FormsModule, LoginComponent, PortalComponent],
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

  vehiculoValidarId = 1;
  entradas: Record<number, number> = {};

  nuevoNombre = '';
  nuevoVehiculoId = 1;

  asignacion: { proyectoId: number | null; piezaId: number | null; cantidad: number } = {
    proyectoId: null, piezaId: null, cantidad: 1
  };

  constructor(private service: PiezasService, public auth: AuthService) {}

  ngOnInit() {
    if (this.auth.logueado) this.cargarTodo();
  }

  // ---------- Permisos para la interfaz ----------
  get esPersonal(): boolean {
    return this.auth.puede('Administrador', 'Tecnico', 'Auxiliar', 'Recepcionista');
  }
  get puedeValidar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }
  get puedeEntradas(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }
  get puedeCrearProyecto(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista'); }
  get puedeAsignar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }
  get puedeFinalizar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }

  // ---------- Sesión ----------
  cerrarSesion() {
    this.auth.logout();
    this.vehiculos = []; this.piezas = []; this.proyectos = [];
    this.alertasIds = new Set();
    this.mensaje = '';
  }

  cargarTodo() {
    this.mensaje = '';
    if (!this.esPersonal) return;

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
    this.recargarInventario();
    this.recargarProyectos();
  }

  // ---------- Carga de datos ----------
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
        const existe = p.some(x => x.id === this.asignacion.proyectoId);
        if (!existe) this.asignacion.proyectoId = p.length ? p[0].id : null;
      },
      error: e => this.manejarError(e, 'No se pudieron cargar los proyectos.')
    });
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

  finalizar(p: Proyecto) {
    this.service.cambiarEstado(p.id, 'Finalizado').subscribe({
      next: () => {
        this.mostrar(`Proyecto "${p.nombre}" finalizado.`, false);
        this.recargarProyectos();
      },
      error: e => this.manejarError(e, 'No se pudo cambiar el estado.')
    });
  }

  // ---------- Ayudas de presentación ----------
  nombrePieza(id: number): string {
    return this.piezas.find(x => x.id === id)?.nombre ?? `Pieza #${id}`;
  }

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