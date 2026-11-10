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
    <section class="gestion">
      <div class="encabezado">
        <h2>Historial técnico del vehículo</h2>
        <button (click)="cargarVehiculos()" [disabled]="cargando">
          {{ cargando ? 'Actualizando...' : '↻ Actualizar' }}
        </button>
      </div>

      <div *ngIf="mensaje" class="aviso error">❌ {{ mensaje }}</div>

      <div class="fila">
        <label>Vehículo
          <select [ngModel]="vehiculoId" (ngModelChange)="elegir($event)">
            <option [ngValue]="null" disabled>Selecciona un vehículo...</option>
            <option *ngFor="let v of vehiculos" [ngValue]="v.id">
              {{ v.marca }} {{ v.modelo }} ({{ v.placa }}) - {{ v.clienteNombre }}
            </option>
          </select>
        </label>
      </div>

      <ng-container *ngIf="historial">
        <div class="ficha">
          <strong>{{ historial.marca }} {{ historial.modelo }}</strong>
          <span>Placa: {{ historial.placa }}</span>
          <span>Año: {{ historial.anio }}</span>
          <span>Cliente: {{ historial.cliente }}</span>
        </div>

        <div class="resumen">
          <div class="dato">
            <span class="valor">{{ historial.totalProyectos }}</span>
            <span>Proyectos</span>
          </div>
          <div class="dato">
            <span class="valor">{{ historial.totalPiezasInstaladas }}</span>
            <span>Piezas instaladas</span>
          </div>
          <div class="dato">
            <span class="valor">S/ {{ historial.inversionTotal | number:'1.2-2' }}</span>
            <span>Inversión total</span>
          </div>
        </div>

        <p class="nota" *ngIf="historial.proyectos.length === 0">
          Este vehículo aún no tiene modificaciones registradas.
        </p>

        <div class="linea">
          <div class="hito" *ngFor="let p of historial.proyectos">
            <span class="punto"></span>
            <div class="contenido">
              <div class="cabecera">
                <div>
                  <strong>Proyecto N° {{ p.id }} – {{ p.nombre }}</strong><br />
                  <span class="nota">Registrado el {{ p.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <span class="estado" [attr.data-estado]="p.estado">{{ p.estado }}</span>
              </div>

              <p class="nota" *ngIf="p.piezas.length === 0">Sin piezas instaladas todavía.</p>
              <div class="tabla-scroll" *ngIf="p.piezas.length > 0">
                <table>
                  <tr>
                    <th>Código</th><th>Pieza</th><th>Marca</th><th>Categoría</th>
                    <th>Cant.</th><th>Precio unit.</th><th>Subtotal</th>
                  </tr>
                  <tr *ngFor="let d of p.piezas">
                    <td>{{ d.codigo }}</td>
                    <td>{{ d.pieza }}</td>
                    <td>{{ d.marca }}</td>
                    <td>{{ d.categoria }}</td>
                    <td>{{ d.cantidad }}</td>
                    <td>S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                    <td>S/ {{ d.subtotal | number:'1.2-2' }}</td>
                  </tr>
                </table>
              </div>

              <div class="orden" *ngIf="p.orden">
                <strong>{{ codigoOrden(p.orden.id) }} · emitida el {{ p.orden.fechaEmision | date:'dd/MM/yyyy' }}
                  por {{ p.orden.emitidaPor }}</strong>
                <span>Piezas: S/ {{ p.orden.totalPiezas | number:'1.2-2' }}
                  · Mano de obra: S/ {{ p.orden.manoObra | number:'1.2-2' }}
                  · <b>Total: S/ {{ p.orden.total | number:'1.2-2' }}</b></span>
              </div>

              <p class="nota" *ngIf="!p.orden && p.piezas.length > 0 && p.estado !== 'Cancelado' && p.estado !== 'Rechazado'">
                Sin orden de trabajo emitida.
              </p>
              <p class="nota" *ngIf="p.estado === 'Cancelado'">Proyecto cancelado: las piezas asignadas volvieron al inventario.</p>
              <p class="nota" *ngIf="p.estado === 'Rechazado'">Proyecto rechazado.</p>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    .encabezado { display: flex; justify-content: space-between; align-items: center; }
    .ficha { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 14px 0 8px; padding: 10px 14px;
             background: #f3f7ff; border: 1px solid #c5d3f5; border-radius: 6px; }

    .resumen { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 16px; }
    .dato { flex: 1; min-width: 150px; border: 1px solid #bbb; border-radius: 8px; padding: 10px 14px;
            display: flex; flex-direction: column; gap: 2px; background: #fafafa; }
    .valor { font-size: 1.4rem; font-weight: bold; color: #1d3f9b; }

    .linea { border-left: 3px solid #c5d3f5; margin-left: 8px; padding-left: 18px; }
    .hito { position: relative; margin-bottom: 18px; }
    .punto { position: absolute; left: -27px; top: 6px; width: 14px; height: 14px;
             border-radius: 50%; background: #1d3f9b; border: 3px solid #fff; box-shadow: 0 0 0 2px #c5d3f5; }
    .contenido { border: 1px solid #bbb; border-radius: 8px; padding: 12px 14px; }
    .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }

    .estado { padding: 3px 12px; border-radius: 12px; font-size: .85rem; font-weight: bold; background: #eee; }
    .estado[data-estado="Registrado"] { background: #e8eefc; color: #1d3f9b; }
    .estado[data-estado="En proceso"] { background: #fff4d6; color: #8a5a00; }
    .estado[data-estado="Finalizado"] { background: #e6f7ec; color: #14683a; }
    .estado[data-estado="En pausa"] { background: #f1e8fb; color: #5b2a99; }
    .estado[data-estado="Cancelado"] { background: #eeeeee; color: #555; }
    .estado[data-estado="Rechazado"] { background: #fdeaea; color: #9b1c1c; }

    .orden { margin-top: 10px; padding: 8px 12px; background: #f3f7ff; border: 1px solid #c5d3f5;
             border-radius: 6px; display: flex; flex-direction: column; gap: 2px; }
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