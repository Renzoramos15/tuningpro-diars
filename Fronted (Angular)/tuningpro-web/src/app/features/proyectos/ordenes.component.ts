import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { Orden, Proyecto, Vehiculo } from '../../core/models';


@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0; border: none; padding: 0;">Órdenes de trabajo</h2>
        <button class="btn-azul" (click)="cargar()" [disabled]="cargando">
          {{ cargando ? 'Actualizando...' : '↻ Actualizar' }}
        </button>
      </div>

      <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
        {{ esError ? '❌' : '✅' }} {{ mensaje }}
      </div>

      <!-- Formulario Generar Orden -->
      <div style="background: #f8fafc; padding: 22px; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 20px;">
        <h3 style="margin-top: 0; margin-bottom: 14px; font-size: 15px; font-weight: 600; color: #1e3a8a;">Generar nueva orden</h3>
        
        <p class="nota" *ngIf="pendientes.length === 0" style="margin-bottom: 12px;">
          No hay proyectos pendientes de orden. Un proyecto necesita al menos una pieza asignada.
        </p>

        <div class="fila" *ngIf="pendientes.length > 0">
          <label style="flex: 3; min-width: 260px;">
            Proyecto
            <select [(ngModel)]="proyectoId" class="input-amplio">
              <option [ngValue]="null" disabled>Proyecto...</option>
              <option *ngFor="let p of pendientes" [ngValue]="p.id">
                N° {{ p.id }} - {{ p.nombre }} (piezas S/ {{ totalPiezas(p) | number:'1.2-2' }})
              </option>
            </select>
          </label>

          <label style="flex: 1.5; min-width: 160px;">
            Mano de obra (S/)
            <input type="number" min="0" step="0.01" [(ngModel)]="manoObra" class="input-amplio" />
          </label>

          <label style="flex: 3; min-width: 260px;">
            Observaciones
            <input type="text" placeholder="Observaciones (opcional)" [(ngModel)]="observaciones" class="input-amplio" />
          </label>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 12px;" *ngIf="seleccionado">
          <div style="font-size: 13px; color: #64748b;">
            Piezas: <strong style="color: #1e293b;">S/ {{ totalPiezas(seleccionado) | number:'1.2-2' }}</strong>
            + Mano de obra: <strong style="color: #1e293b;">S/ {{ manoObraNumero | number:'1.2-2' }}</strong>
            = Total: <strong style="color: #15803d; font-size: 14px;">S/ {{ totalPiezas(seleccionado) + manoObraNumero | number:'1.2-2' }}</strong>
          </div>
          <button class="btn-azul" (click)="generar()">Generar orden</button>
        </div>
      </div>

      <!-- Lista de Órdenes Emitidas -->
      <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-bottom: 12px;">Órdenes emitidas</h3>
      <p class="nota" *ngIf="ordenes.length === 0">Aún no se han emitido órdenes.</p>

      <div class="tabla-scroll" *ngIf="ordenes.length > 0">
        <table>
          <thead>
            <tr>
              <th>N° OT</th>
              <th>Proyecto</th>
              <th>Vehículo / Cliente</th>
              <th>Fecha</th>
              <th>Piezas</th>
              <th>Total piezas</th>
              <th>Mano de obra</th>
              <th>Total</th>
              <th>Emitida por</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of ordenes">
              <td><strong style="color: #1d4ed8;">{{ codigo(o.id) }}</strong></td>
              <td><strong>N° {{ o.proyectoId }} - {{ o.proyecto }}</strong></td>
              <td>{{ o.vehiculo }}<br /><span style="font-size: 12px; color: #64748b;">{{ o.cliente }}</span></td>
              <td style="color: #64748b; font-size: 13px;">{{ o.fechaEmision | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <div *ngFor="let d of o.piezas" style="font-size: 13px; margin-bottom: 2px;">
                  • {{ d.cantidad }} × {{ d.pieza }}
                </div>
                <div *ngIf="o.observaciones" style="font-size: 12px; color: #64748b; margin-top: 4px;">Obs.: {{ o.observaciones }}</div>
              </td>
              <td>S/ {{ o.totalPiezas | number:'1.2-2' }}</td>
              <td>S/ {{ o.manoObra | number:'1.2-2' }}</td>
              <td><strong style="color: #15803d;">S/ {{ o.total | number:'1.2-2' }}</strong></td>
              <td style="color: #64748b; font-size: 13px;">{{ o.emitidaPor }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    section { 
      background: #ffffff;
      margin-top: 24px; 
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .nota { color: #64748b; font-size: 13px; margin: 6px 0 12px 0; }
    .fila { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; margin-top: 10px; }
    
    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-weight: 600;
      font-size: 13px;
      color: #475569;
    }

    .input-amplio {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      background-color: #f8fafc;
      color: #0f172a;
      box-sizing: border-box;
      transition: all 0.2s ease;
    }

    .input-amplio:focus {
      border-color: #2563eb;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .tabla-scroll { 
      overflow-x: auto; 
      margin-top: 14px; 
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      background-color: #ffffff;
      font-size: 14px;
    }
    th, td { 
      border-bottom: 1px solid #e2e8f0; 
      padding: 12px 16px; 
      text-align: left; 
      vertical-align: middle; 
    }
    th { 
      background: #f8fafc; 
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
    }
    tr:hover td {
      background-color: #f8fafc;
    }
    .btn-azul {
      padding: 8px 16px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .btn-azul:hover {
      background: #1d4ed8;
    }
    .btn-azul:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
  `]
})
export class OrdenesComponent implements OnInit {
  ordenes: Orden[] = [];
  proyectos: Proyecto[] = [];
  vehiculos: Vehiculo[] = [];

  proyectoId: number | null = null;
  manoObra: number | null = 0;
  observaciones = '';

  mensaje = '';
  esError = false;
  cargando = false;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.cargar(); }

  get pendientes(): Proyecto[] {
    const conOrden = new Set(this.ordenes.map(o => o.proyectoId));
    return this.proyectos.filter(p =>
      p.detalles.length > 0 && !conOrden.has(p.id) &&
      p.estado !== 'Cancelado' && p.estado !== 'Rechazado');
  }

  get seleccionado(): Proyecto | undefined {
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
      proyectos: this.http.get<Proyecto[]>(`${API_URL}/proyectos`)
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

  totalPiezas(p: Proyecto): number {
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