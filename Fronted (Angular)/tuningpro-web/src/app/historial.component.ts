import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { mensajeError } from './errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; clienteNombre: string; }

interface HistorialPieza {
  codigo: string; pieza: string; categoria: string; marca: string;
  cantidad: number; precioUnitario: number; subtotal: number;
}
interface HistorialOrden {
  id: number; fechaEmision: string; manoObra: number; totalPiezas: number; total: number; emitidaPor: string;
}
interface HistorialProyecto {
  id: number; nombre: string; estado: string; fechaRegistro: string;
  piezas: HistorialPieza[]; totalPiezas: number; orden: HistorialOrden | null;
}
interface Historial {
  id: number; placa: string; marca: string; modelo: string; anio: number; cliente: string;
  totalProyectos: number; totalPiezasInstaladas: number; inversionTotal: number;
  proyectos: HistorialProyecto[];
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0; border: none; padding: 0;">Historial técnico del vehículo</h2>
        <button class="btn-azul" (click)="cargarVehiculos()" [disabled]="cargando">
          {{ cargando ? 'Actualizando...' : '↻ Actualizar' }}
        </button>
      </div>

      <div *ngIf="mensaje" class="aviso error">❌ {{ mensaje }}</div>

      <!-- Formulario de selección -->
      <div style="background: #f8fafc; padding: 18px; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 20px;">
        <div class="fila" style="margin-top: 0;">
          <label style="flex: 1; min-width: 280px;">
            Vehículo
            <select [ngModel]="vehiculoId" (ngModelChange)="elegir($event)" class="input-amplio">
              <option [ngValue]="null" disabled>Selecciona un vehículo...</option>
              <option *ngFor="let v of vehiculos" [ngValue]="v.id">
                {{ v.marca }} {{ v.modelo }} ({{ v.placa }}) - {{ v.clienteNombre }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <ng-container *ngIf="historial">
        <!-- Ficha del vehículo -->
        <div class="ficha">
          <div><strong>{{ historial.marca }} {{ historial.modelo }}</strong></div>
          <div>Placa: <span style="color: #475569;">{{ historial.placa }}</span></div>
          <div>Año: <span style="color: #475569;">{{ historial.anio }}</span></div>
          <div>Cliente: <span style="color: #475569;">{{ historial.cliente }}</span></div>
        </div>

        <!-- Tarjetas de Resumen -->
        <div class="resumen">
          <div class="dato">
            <span class="valor">{{ historial.totalProyectos }}</span>
            <span class="subtitulo">Proyectos</span>
          </div>
          <div class="dato">
            <span class="valor">{{ historial.totalPiezasInstaladas }}</span>
            <span class="subtitulo">Piezas instaladas</span>
          </div>
          <div class="dato">
            <span class="valor" style="color: #15803d;">S/ {{ historial.inversionTotal | number:'1.2-2' }}</span>
            <span class="subtitulo">Inversión total</span>
          </div>
        </div>

        <p class="nota" *ngIf="historial.proyectos.length === 0">
          Este vehículo aún no tiene modificaciones registradas.
        </p>

        <!-- Línea de tiempo de proyectos -->
        <div class="linea">
          <div class="hito" *ngFor="let p of historial.proyectos">
            <span class="punto"></span>
            <div class="contenido">
              <div class="cabecera">
                <div>
                  <strong style="font-size: 1rem; color: #1e3a8a;">Proyecto N° {{ p.id }} – {{ p.nombre }}</strong><br />
                  <span class="nota">Registrado el {{ p.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <span class="estado" [attr.data-estado]="p.estado">{{ p.estado }}</span>
              </div>

              <p class="nota" *ngIf="p.piezas.length === 0">Sin piezas instaladas todavía.</p>
              
              <div class="tabla-scroll" *ngIf="p.piezas.length > 0">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Pieza</th>
                      <th>Marca</th>
                      <th>Categoría</th>
                      <th>Cant.</th>
                      <th>Precio unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let d of p.piezas">
                      <td><strong style="color: #1d4ed8;">{{ d.codigo }}</strong></td>
                      <td><strong>{{ d.pieza }}</strong></td>
                      <td>{{ d.marca }}</td>
                      <td>{{ d.categoria }}</td>
                      <td>{{ d.cantidad }}</td>
                      <td>S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                      <td><strong style="color: #15803d;">S/ {{ d.subtotal | number:'1.2-2' }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Orden de trabajo vinculada -->
              <div class="orden" *ngIf="p.orden">
                <strong style="color: #1e3a8a;">{{ codigoOrden(p.orden.id) }} · emitida el {{ p.orden.fechaEmision | date:'dd/MM/yyyy' }}
                  por {{ p.orden.emitidaPor }}</strong>
                <span style="font-size: 13px; color: #475569;">Piezas: S/ {{ p.orden.totalPiezas | number:'1.2-2' }}
                  · Mano de obra: S/ {{ p.orden.manoObra | number:'1.2-2' }}
                  · <strong style="color: #15803d;">Total: S/ {{ p.orden.total | number:'1.2-2' }}</strong></span>
              </div>
              <p class="nota" *ngIf="!p.orden && p.piezas.length > 0" style="margin-top: 10px;">Sin orden de trabajo emitida.</p>
            </div>
          </div>
        </div>
      </ng-container>
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
    .fila { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-top: 10px; }

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

    .ficha { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 8px 24px; 
      margin: 16px 0; 
      padding: 14px 18px;
      background: #f8fafc; 
      border: 1.5px solid #e2e8f0; 
      border-radius: 12px; 
      font-size: 14px;
      color: #1e3a8a;
    }

    .resumen { display: flex; flex-wrap: wrap; gap: 14px; margin: 16px 0 24px; }
    .dato { 
      flex: 1; 
      min-width: 160px; 
      border: 1.5px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 16px;
      display: flex; 
      flex-direction: column; 
      gap: 4px; 
      background: #ffffff; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .valor { font-size: 1.6rem; font-weight: 700; color: #1e3a8a; }
    .subtitulo { font-size: 13px; color: #64748b; font-weight: 600; }

    .linea { border-left: 3px solid #cbd5e1; margin-left: 12px; padding-left: 24px; margin-top: 20px; }
    .hito { position: relative; margin-bottom: 24px; }
    .punto { 
      position: absolute; 
      left: -33.5px; 
      top: 6px; 
      width: 14px; 
      height: 14px;
      border-radius: 50%; 
      background: #2563eb; 
      border: 3px solid #fff; 
      box-shadow: 0 0 0 2px #cbd5e1; 
    }
    .contenido { 
      border: 1.5px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 16px; 
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }

    .estado { 
      padding: 4px 12px; 
      border-radius: 20px; 
      font-size: .75rem; 
      font-weight: 700; 
      display: inline-block;
      text-align: center;
    }
    .estado[data-estado="Registrado"] { background: #e0f2fe; color: #0369a1; }
    .estado[data-estado="En proceso"] { background: #fef3c7; color: #b45309; }
    .estado[data-estado="Finalizado"] { background: #dcfce7; color: #15803d; }

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
    tr:hover td { background-color: #f8fafc; }

    .orden { 
      margin-top: 14px; 
      padding: 12px 16px; 
      background: #f8fafc; 
      border: 1.5px solid #e2e8f0;
      border-radius: 8px; 
      display: flex; 
      flex-direction: column; 
      gap: 4px; 
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
    .btn-azul:hover { background: #1d4ed8; }
    .btn-azul:disabled { background: #94a3b8; cursor: not-allowed; }

    .aviso { 
      padding: 12px 16px; 
      border-radius: 10px; 
      margin: 16px 0; 
      font-weight: 600; 
      font-size: 14px;
    }
    .aviso.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  `]
})
export class HistorialComponent implements OnInit {
  vehiculos: VehiculoItem[] = [];
  vehiculoId: number | null = null;
  historial: Historial | null = null;

  mensaje = '';
  cargando = false;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.cargarVehiculos(); }

  cargarVehiculos() {
    this.cargando = true;
    this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`).subscribe({
      next: v => {
        this.vehiculos = v;
        if (!v.some(x => x.id === this.vehiculoId)) {
          this.vehiculoId = v.length ? v[0].id : null;
        }
        this.cargarHistorial();
      },
      error: e => {
        this.cargando = false;
        this.mensaje = mensajeError(e, 'No se pudieron cargar los vehículos.');
      }
    });
  }

  elegir(id: number) {
    this.vehiculoId = id;
    this.cargarHistorial();
  }

  cargarHistorial() {
    if (this.vehiculoId == null) {
      this.historial = null;
      this.cargando = false;
      return;
    }
    this.mensaje = '';
    this.http.get<Historial>(`${API_URL}/historial/${this.vehiculoId}`).subscribe({
      next: h => { this.historial = h; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.historial = null;
        this.mensaje = mensajeError(e, 'No se pudo cargar el historial.');
      }
    });
  }

  codigoOrden(id: number): string {
    return 'OT-' + String(id).padStart(4, '0');
  }
}