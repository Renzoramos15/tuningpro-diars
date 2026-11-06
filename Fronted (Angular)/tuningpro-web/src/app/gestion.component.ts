import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculosComponent } from './vehiculos.component';
import { CatalogoPiezasComponent } from './catalogo-piezas.component';
import { ProveedoresComponent } from './proveedores.component';
import { CompatibilidadesComponent } from './compatibilidades.component';

type Pestana = 'vehiculos' | 'piezas' | 'proveedores' | 'compatibilidades';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, VehiculosComponent, CatalogoPiezasComponent, ProveedoresComponent, CompatibilidadesComponent],
  template: `
    <section class="gestion">
      <h2>Gestión de datos del taller</h2>

      <div class="tabs">
        <button class="tab" *ngFor="let t of pestanas"
                [class.activa]="t.id === activa" (click)="activa = t.id">
          {{ t.texto }}
        </button>
      </div>

      <app-vehiculos *ngIf="activa === 'vehiculos'" (cambio)="cambio.emit()"></app-vehiculos>
      <app-catalogo-piezas *ngIf="activa === 'piezas'" (cambio)="cambio.emit()"></app-catalogo-piezas>
      <app-proveedores *ngIf="activa === 'proveedores'" (cambio)="cambio.emit()"></app-proveedores>
      <app-compatibilidades *ngIf="activa === 'compatibilidades'" (cambio)="cambio.emit()"></app-compatibilidades>
    </section>
  `
})
export class GestionComponent {
  @Output() cambio = new EventEmitter<void>();

  activa: Pestana = 'vehiculos';
  pestanas: { id: Pestana; texto: string }[] = [
    { id: 'vehiculos', texto: '🚗 Vehículos' },
    { id: 'piezas', texto: '🔩 Piezas' },
    { id: 'proveedores', texto: '🏭 Proveedores' },
    { id: 'compatibilidades', texto: '✔ Compatibilidades' }
  ];
}