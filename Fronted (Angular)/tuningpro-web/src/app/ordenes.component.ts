import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from './api.config';

interface OrdenDetalle { pieza: string; cantidad: number; precioUnitario: number; subtotal: number; }
interface Orden {
  id: number; proyectoId: number; proyecto: string; vehiculo: string; cliente: string;
  fechaEmision: string; piezas: OrdenDetalle[]; manoObra: number; totalPiezas: number;
  total: number; observaciones: string; emitidaPor: string;
}
interface ProyectoLite {
  id: number; nombre: string; vehiculoId: number; estado: string;
  detalles: { cantidad: number; precioUnitario: number }[];
}
interface VehiculoLite { id: number; placa: string; marca: string; modelo: string; }

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <div class="encabezado">
        <h2>Órdenes de trabajo</h2>
        <button (click)="cargar()" [disabled]="cargando">{{ cargando ? 'Actualizando...' : '↻ Actualizar' }}</button>
      </div>

      <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
        {{ esError ? '❌' : '✅' }} {{ mensaje }}
      </div>

      <!-- Generar -->
      <h3>Generar orden</h3>
      <p class="nota" *ngIf="pendientes.length === 0">
        No hay proyectos pendientes de orden. Un proyecto necesita al menos una pieza asignada.
      </p>

      <div class="fila" *ngIf="pendientes.length > 0">
        <select [(ngModel)]="proyectoId">
          <option [ngValue]="null" disabled>Proyecto...</option>
          <option *ngFor="let p of pendientes" [ngValue]="p.id">
            N° {{ p.id }} - {{ p.nombre }} (piezas S/ {{ totalPiezas(p) | number:'1.2-2' }})
          </option>
        </select>
        <label>Mano de obra (S/)
          <input type="number" min="0" step="0.01" [(ngModel)]="manoObra" class="num" />
        </label>
        <input type="text" placeholder="Observaciones (opcional)" [(ngModel)]="observaciones" class="texto" />
        <button (click)="generar()">Generar orden</button>
      </div>

      <div class="resumen" *ngIf="seleccionado">
        Piezas: <strong>S/ {{ totalPiezas(seleccionado) | number:'1.2-2' }}</strong>
        + Mano de obra: <strong>S/ {{ manoObraNumero | number:'1.2-2' }}</strong>
        = Total: <strong>S/ {{ totalPiezas(seleccionado) + manoObraNumero | number:'1.2-2' }}</strong>
      </div>

      <!-- Lista -->
      <h3>Órdenes emitidas</h3>
      <p class="nota" *ngIf="ordenes.length === 0">Aún no se han emitido órdenes.</p>

      <div class="tabla-scroll" *ngIf="ordenes.length > 0">
        <table>
          <tr>
            <th>N° OT</th><th>Proyecto</th><th>Vehículo / Cliente</th><th>Fecha</th>
            <th>Piezas</th><th>Total piezas</th><th>Mano de obra</th><th>Total</th><th>Emitida por</th>
          </tr>
          <tr *ngFor="let o of ordenes">
            <td>{{ codigo(o.id) }}</td>
            <td>N° {{ o.proyectoId }} - {{ o.proyecto }}</td>
            <td>{{ o.vehiculo }}<br /><span class="nota">{{ o.cliente }}</span></td>
            <td>{{ o.fechaEmision | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              <div *ngFor="let d of o.piezas">{{ d.cantidad }} × {{ d.pieza }}</div>
              <div class="nota" *ngIf="o.observaciones">Obs.: {{ o.observaciones }}</div>
            </td>
            <td>S/ {{ o.totalPiezas | number:'1.2-2' }}</td>
            <td>S/ {{ o.manoObra | number:'1.2-2' }}</td>
            <td><strong>S/ {{ o.total | number:'1.2-2' }}</strong></td>
            <td>{{ o.emitidaPor }}</td>
          </tr>
        </table>
      </div>
    </section>
  `,
  styles: [`
    section { margin-top: 24px; font-family: Arial, sans-serif; }
    .encabezado { display: flex; justify-content: space-between; align-items: center; }
    h3 { margin: 16px 0 8px; font-size: 1.05rem; }
    .nota { color: #555; margin: 4px 0; font-size: .9rem; }
    .fila { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; }
    label { display: flex; flex-direction: column; gap: 2px; font-size: .85rem; font-weight: bold; }
    select, input { padding: 6px; font-weight: normal; }
    .num { width: 110px; }
    .texto { min-width: 220px; }
    button { padding: 6px 12px; cursor: pointer; }
    .resumen { margin-top: 10px; padding: 10px; background: #f3f7ff; border: 1px solid #c5d3f5; border-radius: 6px; }
    .aviso { padding: 10px 14px; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    .aviso.ok { background: #e6f7ec; color: #14683a; border: 1px solid #9fd8b4; }
    .aviso.error { background: #fdeaea; color: #9b1c1c; border: 1px solid #f1aeae; }
    .tabla-scroll { overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #bbb; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; }
  `]
})
export class OrdenesComponent implements OnInit {
  ordenes: Orden[] = [];
  proyectos: ProyectoLite[] = [];
  vehiculos: VehiculoLite[] = [];

  proyectoId: number | null = null;
  manoObra: number | null = 0;
  observaciones = '';

  mensaje = '';
  esError = false;
  cargando = false;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.cargar(); }

  get pendientes(): ProyectoLite[] {
    const conOrden = new Set(this.ordenes.map(o => o.proyectoId));
    return this.proyectos.filter(p => p.detalles.length > 0 && !conOrden.has(p.id));
  }

  get seleccionado(): ProyectoLite | undefined {
    return this.pendientes.find(p => p.id === this.proyectoId);
  }

  get manoObraNumero(): number {
    const n = Number(this.manoObra ?? 0);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  cargar() {
    this.cargando = true;
    forkJoin({
      ordenes: this.http.get<Orden[]>(`${API_URL}/ordenes`),
      proyectos: this.http.get<ProyectoLite[]>(`${API_URL}/proyectos`)
    }).subscribe({
      next: r => {
        this.ordenes = r.ordenes;
        this.proyectos = r.proyectos;
        this.cargando = false;
        if (!this.pendientes.some(p => p.id === this.proyectoId)) {
          this.proyectoId = this.pendientes.length ? this.pendientes[0].id : null;
        }
      },
      error: e => { this.cargando = false; this.manejarError(e, 'No se pudieron cargar las órdenes.'); }
    });
  }

  generar() {
    if (this.proyectoId == null) {
      this.mostrar('Selecciona un proyecto.', true);
      return;
    }
    const mano = Number(this.manoObra ?? 0);
    if (isNaN(mano) || mano < 0) {
      this.mostrar('La mano de obra debe ser un número mayor o igual a 0.', true);
      return;
    }
    this.http.post<Orden>(`${API_URL}/ordenes`, {
      proyectoId: this.proyectoId, manoObra: mano, observaciones: this.observaciones
    }).subscribe({
      next: o => {
        this.mostrar(`Orden ${this.codigo(o.id)} generada. Total: S/ ${o.total.toFixed(2)}`, false);
        this.manoObra = 0;
        this.observaciones = '';
        this.cargar();
      },
      error: e => this.manejarError(e, 'No se pudo generar la orden.')
    });
  }

  totalPiezas(p: ProyectoLite): number {
    return p.detalles.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
  }

  codigo(id: number): string {
    return 'OT-' + String(id).padStart(4, '0');
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }

  private manejarError(err: any, porDefecto: string) {
    if (err?.status === 0) this.mostrar('No se pudo conectar con la API. ¿Está corriendo?', true);
    else if (err?.status === 403) this.mostrar('Tu rol no tiene permiso para esta acción.', true);
    else if (err?.status === 401) this.mostrar('Tu sesión expiró. Inicia sesión de nuevo.', true);
    else this.mostrar(err?.error?.mensaje ?? porDefecto, true);
  }
}