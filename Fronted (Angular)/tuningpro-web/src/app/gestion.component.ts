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

      <div class="contenido-pestana">
        <app-vehiculos *ngIf="activa === 'vehiculos'" (cambio)="cambio.emit()"></app-vehiculos>
        <app-catalogo-piezas *ngIf="activa === 'piezas'" (cambio)="cambio.emit()"></app-catalogo-piezas>
        <app-proveedores *ngIf="activa === 'proveedores'" (cambio)="cambio.emit()"></app-proveedores>
        <app-compatibilidades *ngIf="activa === 'compatibilidades'" (cambio)="cambio.emit()"></app-compatibilidades>
      </div>
    </section>
  `,
  styles: [`
    section.gestion { 
      background: #ffffff;
      margin-top: 24px; 
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    h2 { 
      margin-top: 0;
      margin-bottom: 16px; 
      font-size: 1.25rem; 
      font-weight: 600;
      color: #1e3a8a;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 10px;
    }

    .tabs { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 8px; 
      margin-bottom: 20px; 
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 12px;
    }

    .tab { 
      padding: 10px 18px; 
      background: #f8fafc; 
      color: #475569; 
      border: 1.5px solid #cbd5e1;
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 13px; 
      cursor: pointer; 
      transition: all 0.2s ease;
    }

    .tab:hover { 
      background: #f1f5f9; 
      color: #1e293b;
      border-color: #94a3b8;
    }

    .tab.activa { 
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); 
      color: #ffffff; 
      border-color: #1d4ed8;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }

    .contenido-pestana {
      margin-top: 8px;
    }
  `]
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