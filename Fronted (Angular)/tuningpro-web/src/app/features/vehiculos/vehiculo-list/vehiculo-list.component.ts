import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vehiculo, ClienteCuenta } from '../../../core/models';

@Component({
  selector: 'app-vehiculo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fila" style="margin-bottom: 16px; align-items: flex-end;">
      <label style="flex: 3; min-width: 260px;">
        Buscar por placa, marca, modelo o cliente
        <input type="text" [(ngModel)]="texto" (keyup.enter)="buscarAhora()" placeholder="Ej. Torres" class="input-amplio" />
      </label>
      <div style="display: flex; gap: 8px;">
        <button class="btn-azul" (click)="buscarAhora()">Buscar</button>
        <button class="btn-secundario" (click)="limpiarBusqueda()" *ngIf="texto">Limpiar</button>
      </div>
    </div>

    <p class="nota" *ngIf="vehiculos.length === 0">No se encontraron vehículos.</p>

    <div class="tabla-scroll" *ngIf="vehiculos.length > 0">
      <table>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Vehículo</th>
            <th>Año</th>
            <th>Cliente</th>
            <th>Cuenta del portal</th>
            <th *ngIf="puedeEditar">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let v of vehiculos">
            <td><strong style="color: #1d4ed8;">{{ v.placa }}</strong></td>
            <td><strong>{{ v.marca }} {{ v.modelo }}</strong></td>
            <td>{{ v.anio }}</td>
            <td>{{ v.clienteNombre }}</td>
            <td>
              <span *ngIf="v.usuarioId != null" class="etiqueta">{{ cuenta(v) }}</span>
              <span *ngIf="v.usuarioId == null" style="color: #94a3b8; font-size: 13px;">Sin cuenta</span>
            </td>
            <td *ngIf="puedeEditar">
              <button class="btn-azul" style="padding: 6px 12px; font-size: 12px;" (click)="editar.emit(v)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrl: '../../../shared/estilos-gestion.css'
})
export class VehiculoListComponent {
  @Input() vehiculos: Vehiculo[] = [];
  @Input() clientes: ClienteCuenta[] = [];
  @Input() puedeEditar = false;

  @Output() buscar = new EventEmitter<string>();
  @Output() editar = new EventEmitter<Vehiculo>();

  texto = '';

  buscarAhora() {
    this.buscar.emit(this.texto.trim());
  }

  limpiarBusqueda() {
    this.texto = '';
    this.buscar.emit('');
  }

  cuenta(v: Vehiculo): string {
    const c = this.clientes.find(x => x.id === v.usuarioId);
    return c ? c.nombreUsuario : 'Vinculado';
  }
}