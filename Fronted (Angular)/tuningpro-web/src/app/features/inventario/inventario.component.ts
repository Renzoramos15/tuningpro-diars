import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PiezasService } from '../../core/piezas.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { Pieza, Vehiculo } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <section>
      <h2>Inventario de piezas</h2>

      <label *ngIf="puedeValidar">
        Validar compatibilidad con:
        <select [(ngModel)]="vehiculoValidarId">
          <option *ngFor="let v of vehiculos" [ngValue]="v.id">
            {{ v.marca }} {{ v.modelo }} ({{ v.placa }}) - {{ v.anio }}
          </option>
        </select>
      </label>

      <div class="tabla-scroll">
        <table>
          <tr>
            <th>Código</th><th>Nombre</th><th>Categoría</th>
            <th>Stock</th><th>Precio</th>
            <th *ngIf="puedeValidar">Compatibilidad</th>
            <th *ngIf="puedeEntradas">Registrar entrada</th>
          </tr>
          <tr *ngFor="let p of piezas" [class.stock-bajo]="esStockBajo(p)">
            <td>{{ p.codigo }}</td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.categoria }}</td>
            <td>
              {{ p.stock }}
              <span *ngIf="esStockBajo(p)" class="etiqueta">⚠ Stock bajo</span>
            </td>
            <td>S/ {{ p.precioUnitario | number:'1.2-2' }}</td>
            <td *ngIf="puedeValidar"><button (click)="validar(p.id)">Validar</button></td>
            <td *ngIf="puedeEntradas">
              <input type="number" min="1" placeholder="Cant." [(ngModel)]="entradas[p.id]" class="num" />
              <button (click)="registrarEntrada(p)">+ Entrada</button>
            </td>
          </tr>
        </table>
      </div>
    </section>
  `,
  styleUrl: '../../shared/estilos-panel.css'
})
export class InventarioComponent implements OnInit {
  piezas: Pieza[] = [];
  vehiculos: Vehiculo[] = [];
  alertasIds = new Set<number>();
  vehiculoValidarId = 1;
  entradas: Record<number, number> = {};
  mensaje = '';
  esError = false;

  constructor(private service: PiezasService, private auth: AuthService) {}

  get puedeValidar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }
  get puedeEntradas(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }

  ngOnInit() {
    this.cargarPiezas();
    if (this.puedeValidar) {
      this.service.getVehiculos().subscribe({
        next: v => {
          this.vehiculos = v;
          if (v.length) this.vehiculoValidarId = v[0].id;
        },
        error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
      });
    }
  }

  private cargarPiezas() {
    this.service.getPiezas().subscribe({
      next: p => (this.piezas = p),
      error: e => this.mostrar(mensajeError(e, 'No se pudo conectar con la API.'), true)
    });
    this.service.getAlertas().subscribe({
      next: a => (this.alertasIds = new Set(a.map(x => x.id)))
    });
  }

  validar(piezaId: number) {
    this.service.validar(Number(this.vehiculoValidarId), piezaId).subscribe({
      next: r => this.mostrar(r.mensaje, !r.esCompatible),
      error: e => this.mostrar(mensajeError(e, 'Error al validar.'), true)
    });
  }

  registrarEntrada(p: Pieza) {
    const cantidad = Number(this.entradas[p.id] ?? 0);
    if (cantidad < 1) {
      this.mostrar('Escribe una cantidad mayor a 0 para registrar la entrada.', true);
      return;
    }
    this.service.movimiento(p.id, cantidad, true).subscribe({
      next: () => {
        this.entradas[p.id] = 0;
        this.mostrar(`Entrada registrada: +${cantidad} de "${p.nombre}".`, false);
        this.cargarPiezas();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo registrar la entrada.'), true)
    });
  }

  esStockBajo(p: Pieza): boolean {
    return this.alertasIds.has(p.id);
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}