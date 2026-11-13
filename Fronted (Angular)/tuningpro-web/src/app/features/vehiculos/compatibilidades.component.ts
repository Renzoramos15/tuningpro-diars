import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; anio: number; }
interface PiezaItem { id: number; codigo: string; nombre: string; marca: string; categoria: string; stock: number; }

@Component({
  selector: 'app-compatibilidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-bottom: 16px;">Compatibilidad vehículo – pieza</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <!-- Selección de Vehículo -->
    <div class="formulario-card">
      <div class="fila" style="margin-top: 0;">
        <label style="flex: 1; min-width: 280px;">
          Seleccionar Vehículo
          <select [ngModel]="vehiculoId" (ngModelChange)="elegirVehiculo($event)" class="input-amplio">
            <option [ngValue]="null" disabled>Selecciona un vehículo...</option>
            <option *ngFor="let v of vehiculos" [ngValue]="v.id">
              {{ v.marca }} {{ v.modelo }} ({{ v.placa }}) - {{ v.anio }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <ng-container *ngIf="vehiculoId != null">
      <!-- Formulario de Registro -->
      <div class="formulario-card" *ngIf="puedeEditar">
        <strong style="color: #1e3a8a; font-size: 14px; display: block; margin-bottom: 12px;">
          Registrar nueva compatibilidad
        </strong>
        <div class="fila">
          <label style="flex: 2; min-width: 260px;">
            Pieza disponible
            <select [(ngModel)]="piezaId" class="input-amplio">
              <option [ngValue]="null" disabled>Pieza...</option>
              <option *ngFor="let p of disponibles" [ngValue]="p.id">{{ p.nombre }} ({{ p.categoria }})</option>
            </select>
          </label>
          <div style="display: flex; align-items: flex-end;">
            <button class="btn-azul" (click)="agregar()" [disabled]="disponibles.length === 0">Registrar compatibilidad</button>
          </div>
        </div>
        <p class="nota" *ngIf="disponibles.length === 0" style="margin-top: 10px;">Todas las piezas ya son compatibles con este vehículo.</p>
      </div>

      <h4 style="font-size: 1rem; font-weight: 600; color: #1e3a8a; margin: 20px 0 8px 0;">Piezas compatibles ({{ compatibles.length }})</h4>
      <p class="nota" *ngIf="compatibles.length === 0">Este vehículo aún no tiene piezas compatibles registradas.</p>
      
      <!-- Tabla Moderna -->
      <div class="tabla-scroll" *ngIf="compatibles.length > 0">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Pieza</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th *ngIf="puedeEditar">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of compatibles">
              <td><strong style="color: #1d4ed8;">{{ p.codigo }}</strong></td>
              <td><strong>{{ p.nombre }}</strong></td>
              <td>{{ p.marca }}</td>
              <td>{{ p.categoria }}</td>
              <td>{{ p.stock }}</td>
              <td *ngIf="puedeEditar">
                <button class="btn-rojo" (click)="quitar(p)">Quitar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="nota" style="margin-top: 16px; font-style: italic;">
        Además de estar registrada, cada categoría puede tener reglas propias al validar la pieza
        (por ejemplo, el Turbo exige un vehículo 1995 o posterior).
      </p>
    </ng-container>
  `,
  styles: [`
    .nota { color: #64748b; font-size: 13px; margin: 6px 0 12px 0; }
    .fila { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; margin-top: 12px; }

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

    .formulario-card {
      background: #f8fafc; 
      padding: 18px; 
      border-radius: 12px; 
      border: 1.5px solid #e2e8f0; 
      margin-bottom: 20px;
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
    tr:hover td { background-color: #f8fafc; }

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
      height: 41px;
    }
    .btn-azul:hover { background: #1d4ed8; }
    .btn-azul:disabled { background: #94a3b8; cursor: not-allowed; }

    .btn-rojo {
      padding: 6px 12px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .btn-rojo:hover { background: #dc2626; }

    .aviso { 
      padding: 12px 16px; 
      border-radius: 10px; 
      margin: 16px 0; 
      font-weight: 600; 
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .aviso.ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .aviso.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  `]
})
export class CompatibilidadesComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  vehiculos: VehiculoItem[] = [];
  piezas: PiezaItem[] = [];
  compatibles: PiezaItem[] = [];

  vehiculoId: number | null = null;
  piezaId: number | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }

  get disponibles(): PiezaItem[] {
    return this.piezas.filter(p => !this.compatibles.some(c => c.id === p.id));
  }

  ngOnInit() {
    forkJoin({
      vehiculos: this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`),
      piezas: this.http.get<PiezaItem[]>(`${API_URL}/piezas`)
    }).subscribe({
      next: r => {
        this.vehiculos = r.vehiculos;
        this.piezas = r.piezas;
        if (r.vehiculos.length) this.elegirVehiculo(r.vehiculos[0].id);
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los datos.'), true)
    });
  }

  elegirVehiculo(id: number) {
    this.vehiculoId = id;
    this.mensaje = '';
    this.cargarCompatibles();
  }

  cargarCompatibles() {
    if (this.vehiculoId == null) return;
    this.http.get<PiezaItem[]>(`${API_URL}/compatibilidad`, { params: { vehiculoId: this.vehiculoId } }).subscribe({
      next: c => {
        this.compatibles = c;
        this.piezaId = this.disponibles.length ? this.disponibles[0].id : null;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar las compatibilidades.'), true)
    });
  }

  agregar() {
    if (this.vehiculoId == null || this.piezaId == null) {
      this.mostrar('Selecciona un vehículo y una pieza.', true);
      return;
    }
    this.http.post(`${API_URL}/compatibilidad`, { vehiculoId: this.vehiculoId, piezaId: this.piezaId }).subscribe({
      next: () => {
        this.mostrar('Compatibilidad registrada.', false);
        this.cargarCompatibles();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo registrar la compatibilidad.'), true)
    });
  }

  quitar(p: PiezaItem) {
    if (this.vehiculoId == null) return;
    if (!confirm(`¿Quitar "${p.nombre}" de las piezas compatibles de este vehículo?`)) return;

    this.http.delete(`${API_URL}/compatibilidad`, {
      params: { vehiculoId: this.vehiculoId, piezaId: p.id }
    }).subscribe({
      next: () => {
        this.mostrar('Compatibilidad eliminada.', false);
        this.cargarCompatibles();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo eliminar la compatibilidad.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}