import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';

interface PortalVehiculo { id: number; placa: string; marca: string; modelo: string; anio: number; }
interface PortalDetalle {
  pieza: string; categoria: string; cantidad: number; precioUnitario: number; subtotal: number;
}
interface PortalProyecto {
  id: number; nombre: string; vehiculo: string; estado: string;
  fechaRegistro: string; piezas: PortalDetalle[]; total: number;
}
interface PortalResumen { cliente: string; vehiculos: PortalVehiculo[]; proyectos: PortalProyecto[]; }

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <div class="encabezado">
        <h2>Mis proyectos</h2>
        <button (click)="cargar()" [disabled]="cargando">{{ cargando ? 'Actualizando...' : '↻ Actualizar' }}</button>
      </div>

      <p class="error" *ngIf="error">❌ {{ error }}</p>

      <ng-container *ngIf="datos">
        <h3>Mis vehículos</h3>
        <p class="nota" *ngIf="datos.vehiculos.length === 0">
          Aún no tienes vehículos asociados a tu cuenta. Consulta en el taller.
        </p>
        <div class="tarjetas">
          <div class="tarjeta" *ngFor="let v of datos.vehiculos">
            <strong>{{ v.marca }} {{ v.modelo }}</strong>
            <span>Placa: {{ v.placa }}</span>
            <span>Año: {{ v.anio }}</span>
          </div>
        </div>

        <h3>Estado de mis proyectos</h3>
        <p class="nota" *ngIf="datos.proyectos.length === 0">
          Todavía no tienes proyectos de personalización registrados.
        </p>

        <div class="proyecto" *ngFor="let p of datos.proyectos">
          <div class="cabecera">
            <div>
              <strong>Proyecto N° {{ p.id }} – {{ p.nombre }}</strong><br />
              <span class="nota">{{ p.vehiculo }} · Registrado el {{ p.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <span class="estado" [attr.data-estado]="p.estado">{{ p.estado }}</span>
          </div>

          <!-- Avance -->
          <div class="pasos">
            <div class="paso" *ngFor="let e of etapas; let i = index"
                 [class.hecho]="i <= indice(p.estado)" [class.actual]="i === indice(p.estado)">
              <span class="punto">{{ i < indice(p.estado) || p.estado === 'Finalizado' ? '✓' : i + 1 }}</span>
              <span>{{ e }}</span>
            </div>
          </div>

          <!-- Historial de piezas -->
          <p class="nota" *ngIf="p.piezas.length === 0">Aún no se han instalado piezas en este proyecto.</p>
          <div class="tabla-scroll" *ngIf="p.piezas.length > 0">
            <table>
              <tr><th>Pieza</th><th>Categoría</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
              <tr *ngFor="let d of p.piezas">
                <td>{{ d.pieza }}</td>
                <td>{{ d.categoria }}</td>
                <td>{{ d.cantidad }}</td>
                <td>S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                <td>S/ {{ d.subtotal | number:'1.2-2' }}</td>
              </tr>
              <tr class="total">
                <td colspan="4">Total en piezas</td>
                <td>S/ {{ p.total | number:'1.2-2' }}</td>
              </tr>
            </table>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    section { margin-top: 24px; font-family: Arial, sans-serif; }
    .encabezado { display: flex; justify-content: space-between; align-items: center; }
    h3 { margin: 16px 0 8px; font-size: 1.05rem; }
    .nota { color: #555; margin: 4px 0; }
    .error { color: #9b1c1c; font-weight: bold; }
    button { padding: 6px 12px; cursor: pointer; }

    .tarjetas { display: flex; flex-wrap: wrap; gap: 10px; }
    .tarjeta { border: 1px solid #bbb; border-radius: 8px; padding: 10px 14px;
               display: flex; flex-direction: column; gap: 2px; min-width: 190px; background: #fafafa; }

    .proyecto { border: 1px solid #bbb; border-radius: 8px; padding: 14px; margin: 12px 0; }
    .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }

    .estado { padding: 3px 12px; border-radius: 12px; font-size: .85rem; font-weight: bold; background: #eee; }
    .estado[data-estado="Registrado"] { background: #e8eefc; color: #1d3f9b; }
    .estado[data-estado="En proceso"] { background: #fff4d6; color: #8a5a00; }
    .estado[data-estado="Finalizado"] { background: #e6f7ec; color: #14683a; }

    .pasos { display: flex; gap: 8px; margin: 14px 0; }
    .paso { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
            color: #888; font-size: .85rem; border-top: 4px solid #ddd; padding-top: 6px; }
    .paso.hecho { border-top-color: #2e8b57; color: #14683a; font-weight: bold; }
    .paso.actual { border-top-color: #1d3f9b; color: #1d3f9b; }
    .punto { width: 24px; height: 24px; border-radius: 50%; background: #ddd; color: #fff;
             display: inline-flex; align-items: center; justify-content: center; font-size: .8rem; }
    .paso.hecho .punto { background: #2e8b57; }
    .paso.actual .punto { background: #1d3f9b; }

    .tabla-scroll { overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #bbb; padding: 8px; text-align: left; }
    th { background: #f0f0f0; }
    tr.total td { font-weight: bold; background: #f7f7f7; }
  `]
})
export class PortalComponent implements OnInit {
  datos: PortalResumen | null = null;
  error = '';
  cargando = false;
  etapas = ['Registrado', 'En proceso', 'Finalizado'];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.error = '';
    this.http.get<PortalResumen>(`${API_URL}/portal/mis-proyectos`).subscribe({
      next: d => { this.datos = d; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.error = e?.status === 0
          ? 'No se pudo conectar con la API.'
          : (e?.status === 401 ? 'Tu sesión expiró. Inicia sesión de nuevo.'
          : (e?.error?.mensaje ?? 'No se pudieron cargar tus proyectos.'));
      }
    });
  }

  indice(estado: string): number {
    const i = this.etapas.indexOf(estado);
    return i < 0 ? 0 : i;
  }
}