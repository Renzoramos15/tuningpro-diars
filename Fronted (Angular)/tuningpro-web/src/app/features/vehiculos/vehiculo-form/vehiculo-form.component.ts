import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vehiculo, ClienteCuenta } from '../../../core/models';

export interface DatosVehiculo {
  placa: string; marca: string; modelo: string; anio: number;
  clienteNombre: string; usuarioId: number | null;
}

@Component({
  selector: 'app-vehiculo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="formulario-card">
      <strong style="color: #1e3a8a; font-size: 14px; display: block; margin-bottom: 12px;">
        {{ id == null ? 'Nuevo vehículo' : 'Editando vehículo N° ' + id }}
      </strong>

      <div class="fila">
        <label style="flex: 1; min-width: 130px;">
          Placa
          <input type="text" [(ngModel)]="placa" placeholder="ABC-123" class="input-amplio" />
        </label>
        <label style="flex: 1.5; min-width: 160px;">
          Marca
          <input type="text" [(ngModel)]="marca" placeholder="Ej. Toyota" class="input-amplio" />
        </label>
        <label style="flex: 1.5; min-width: 160px;">
          Modelo
          <input type="text" [(ngModel)]="modelo" placeholder="Ej. Supra" class="input-amplio" />
        </label>
        <label style="flex: 1; min-width: 100px;">
          Año
          <input type="number" min="1950" [(ngModel)]="anio" class="input-amplio" />
        </label>
        <label style="flex: 2; min-width: 200px;">
          Nombre del cliente
          <input type="text" [(ngModel)]="clienteNombre" placeholder="Nombre completo" class="input-amplio" />
        </label>
        <label style="flex: 2; min-width: 220px;">
          Cuenta del portal
          <select [(ngModel)]="usuarioId" class="input-amplio">
            <option [ngValue]="null">Sin cuenta de portal</option>
            <option *ngFor="let c of clientes" [ngValue]="c.id">{{ c.nombreCompleto }} ({{ c.nombreUsuario }})</option>
          </select>
        </label>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px; align-items: center;">
        <button class="btn-azul" (click)="enviar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button class="btn-secundario" *ngIf="id != null" (click)="cancelarEdicion()">Cancelar</button>
      </div>

      <p class="nota" style="margin-top: 12px;">La cuenta del portal permite que el cliente vea este vehículo y sus proyectos al iniciar sesión.</p>
    </div>
  `,
  styleUrl: '../../../shared/estilos-gestion.css'
})
export class VehiculoFormComponent {
  @Input() clientes: ClienteCuenta[] = [];

  // Cuando el padre manda un vehículo, el formulario se llena para editarlo
  @Input() set vehiculo(v: Vehiculo | null) {
    if (v) this.cargar(v);
  }

  @Output() guardar = new EventEmitter<{ id: number | null; datos: DatosVehiculo }>();
  @Output() cancelar = new EventEmitter<void>();

  id: number | null = null;
  placa = '';
  marca = '';
  modelo = '';
  anio: number | null = null;
  clienteNombre = '';
  usuarioId: number | null = null;

  private cargar(v: Vehiculo) {
    this.id = v.id;
    this.placa = v.placa;
    this.marca = v.marca;
    this.modelo = v.modelo;
    this.anio = v.anio;
    this.clienteNombre = v.clienteNombre;
    this.usuarioId = v.usuarioId;
  }

  limpiar() {
    this.id = null;
    this.placa = '';
    this.marca = '';
    this.modelo = '';
    this.anio = null;
    this.clienteNombre = '';
    this.usuarioId = null;
  }

  enviar() {
    this.guardar.emit({
      id: this.id,
      datos: {
        placa: this.placa, marca: this.marca, modelo: this.modelo,
        anio: Number(this.anio ?? 0), clienteNombre: this.clienteNombre,
        usuarioId: this.usuarioId
      }
    });
  }

  cancelarEdicion() {
    this.limpiar();
    this.cancelar.emit();
  }
}