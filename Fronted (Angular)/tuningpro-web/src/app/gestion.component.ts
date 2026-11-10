import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculosComponent } from './vehiculos.component';
import { CatalogoPiezasComponent } from './catalogo-piezas.component';
import { ProveedoresComponent } from './proveedores.component';
import { CompatibilidadesComponent } from './compatibilidades.component';
import { AuthService } from './auth.service';

type Pestana = 'vehiculos' | 'piezas' | 'proveedores' | 'compatibilidades';

interface PestanaDef { id: Pestana; texto: string; roles: string[]; }

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, VehiculosComponent, CatalogoPiezasComponent, ProveedoresComponent, CompatibilidadesComponent],
  template: `
    <section class="gestion">
      <h2>Gestión de datos del taller</h2>

      <p class="nota" *ngIf="pestanas.length === 0">Tu rol no tiene opciones de gestión.</p>

      <div class="tabs" *ngIf="pestanas.length > 0">
        <button class="tab" *ngFor="let t of pestanas"
                [class.activa]="t.id === activa" (click)="activa = t.id">
          {{ t.texto }}
        </button>
      </div>

      <app-vehiculos *ngIf="activa === 'vehiculos' && visible('vehiculos')" (cambio)="cambio.emit()"></app-vehiculos>
      <app-catalogo-piezas *ngIf="activa === 'piezas' && visible('piezas')" (cambio)="cambio.emit()"></app-catalogo-piezas>
      <app-proveedores *ngIf="activa === 'proveedores' && visible('proveedores')" (cambio)="cambio.emit()"></app-proveedores>
      <app-compatibilidades *ngIf="activa === 'compatibilidades' && visible('compatibilidades')" (cambio)="cambio.emit()"></app-compatibilidades>
    </section>
  `
})
export class GestionComponent {
  @Output() cambio = new EventEmitter<void>();

  private todas: PestanaDef[] = [
    { id: 'vehiculos', texto: '🚗 Vehículos', roles: ['Administrador', 'Recepcionista'] },
    { id: 'piezas', texto: '🔩 Piezas', roles: ['Administrador', 'Auxiliar'] },
    { id: 'proveedores', texto: '🏭 Proveedores', roles: ['Administrador', 'Auxiliar'] },
    { id: 'compatibilidades', texto: '✔ Compatibilidades', roles: ['Administrador', 'Tecnico'] }
  ];

  pestanas: PestanaDef[] = [];
  activa: Pestana = 'vehiculos';

  constructor(private auth: AuthService) {
    this.pestanas = this.todas.filter(t => this.auth.puede(...t.roles));
    if (this.pestanas.length) this.activa = this.pestanas[0].id;
  }

  visible(id: Pestana): boolean {
    return this.pestanas.some(t => t.id === id);
  }
}