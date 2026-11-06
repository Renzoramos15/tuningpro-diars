import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { mensajeError } from './errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; anio: number; }
interface PiezaItem { id: number; codigo: string; nombre: string; marca: string; categoria: string; stock: number; }

@Component({
  selector: 'app-compatibilidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3>Compatibilidad vehículo – pieza</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <div class="fila">
      <label>Vehículo
        <select [ngModel]="vehiculoId" (ngModelChange)="elegirVehiculo($event)">
          <option [ngValue]="null" disabled>Selecciona un vehículo...</option>
          <option *ngFor="let v of vehiculos" [ngValue]="v.id">
            {{ v.marca }} {{ v.modelo }} ({{ v.placa }}) - {{ v.anio }}
          </option>
        </select>
      </label>
    </div>

    <ng-container *ngIf="vehiculoId != null">
      <div class="formulario" *ngIf="puedeEditar">
        <strong>Registrar nueva compatibilidad</strong>
        <div class="fila">
          <label>Pieza
            <select [(ngModel)]="piezaId">
              <option [ngValue]="null" disabled>Pieza...</option>
              <option *ngFor="let p of disponibles" [ngValue]="p.id">{{ p.nombre }} ({{ p.categoria }})</option>
            </select>
          </label>
          <button (click)="agregar()" [disabled]="disponibles.length === 0">Registrar compatibilidad</button>
        </div>
        <p class="nota" *ngIf="disponibles.length === 0">Todas las piezas ya son compatibles con este vehículo.</p>
      </div>

      <h4>Piezas compatibles ({{ compatibles.length }})</h4>
      <p class="nota" *ngIf="compatibles.length === 0">Este vehículo aún no tiene piezas compatibles registradas.</p>
      <div class="tabla-scroll" *ngIf="compatibles.length > 0">
        <table>
          <tr>
            <th>Código</th><th>Pieza</th><th>Marca</th><th>Categoría</th><th>Stock</th>
            <th *ngIf="puedeEditar">Acción</th>
          </tr>
          <tr *ngFor="let p of compatibles">
            <td>{{ p.codigo }}</td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.marca }}</td>
            <td>{{ p.categoria }}</td>
            <td>{{ p.stock }}</td>
            <td *ngIf="puedeEditar"><button (click)="quitar(p)">Quitar</button></td>
          </tr>
        </table>
      </div>
      <p class="nota">
        Además de estar registrada, cada categoría puede tener reglas propias al validar la pieza
        (por ejemplo, el Turbo exige un vehículo 1995 o posterior).
      </p>
    </ng-container>
  `
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