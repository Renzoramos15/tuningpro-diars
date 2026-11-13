import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';

interface PiezaItem {
  id: number; codigo: string; nombre: string; marca: string; categoria: string;
  stock: number; precioUnitario: number; proveedorId: number;
}
interface ProveedorItem { id: number; nombre: string; contacto: string; }

@Component({
  selector: 'app-catalogo-piezas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-bottom: 16px;">Catálogo de piezas</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <!-- Formulario de Registro / Edición -->
    <div class="formulario-card" *ngIf="puedeEditar">
      <strong style="color: #1e3a8a; font-size: 14px; display: block; margin-bottom: 12px;">
        {{ id == null ? 'Nueva pieza' : 'Editando pieza N° ' + id }}
      </strong>
      
      <div class="fila">
        <label style="flex: 1; min-width: 120px;">
          Código
          <input type="text" [(ngModel)]="codigo" placeholder="BRM-002" class="input-amplio" />
        </label>
        <label style="flex: 2; min-width: 200px;">
          Nombre
          <input type="text" [(ngModel)]="nombre" placeholder="Nombre de la pieza" class="input-amplio" />
        </label>
        <label style="flex: 1.5; min-width: 150px;">
          Marca
          <input type="text" [(ngModel)]="marca" placeholder="Marca" class="input-amplio" />
        </label>
        <label style="flex: 1.5; min-width: 150px;">
          Categoría
          <select [(ngModel)]="categoria" class="input-amplio">
            <option *ngFor="let c of categorias" [ngValue]="c">{{ c }}</option>
          </select>
        </label>
        <label style="flex: 1; min-width: 110px;">
          Stock inicial
          <input type="number" min="0" [(ngModel)]="stock" [disabled]="id != null" class="input-amplio" />
        </label>
        <label style="flex: 1; min-width: 110px;">
          Precio (S/)
          <input type="number" min="0" step="0.01" [(ngModel)]="precio" class="input-amplio" />
        </label>
        <label style="flex: 2; min-width: 200px;">
          Proveedor
          <select [(ngModel)]="proveedorId" class="input-amplio">
            <option [ngValue]="null" disabled>Proveedor...</option>
            <option *ngFor="let p of proveedores" [ngValue]="p.id">{{ p.nombre }}</option>
          </select>
        </label>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px; align-items: center;">
        <button class="btn-azul" (click)="guardar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button class="btn-secundario" *ngIf="id != null" (click)="limpiar()">Cancelar</button>
      </div>

      <p class="nota" *ngIf="id != null" style="margin-top: 12px;">
        El stock no se edita aquí: se modifica con "+ Entrada" en el inventario o al asignar piezas a proyectos.
      </p>
    </div>

    <p class="nota" *ngIf="piezas.length === 0">Aún no hay piezas registradas.</p>

    <!-- Tabla Moderna -->
    <div class="tabla-scroll" *ngIf="piezas.length > 0">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Proveedor</th>
            <th>Stock</th>
            <th>Precio</th>
            <th *ngIf="puedeEditar">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of piezas">
            <td><strong style="color: #1d4ed8;">{{ p.codigo }}</strong></td>
            <td><strong>{{ p.nombre }}</strong></td>
            <td>{{ p.marca }}</td>
            <td>{{ p.categoria }}</td>
            <td>{{ nombreProveedor(p.proveedorId) }}</td>
            <td>{{ p.stock }}</td>
            <td><strong style="color: #15803d;">S/ {{ p.precioUnitario | number:'1.2-2' }}</strong></td>
            <td *ngIf="puedeEditar">
              <button class="btn-azul" style="padding: 6px 12px; font-size: 12px;" (click)="editar(p)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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

    .input-amplio:disabled {
      background-color: #e2e8f0;
      cursor: not-allowed;
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
    }
    .btn-azul:hover { background: #1d4ed8; }

    .btn-secundario {
      padding: 8px 16px;
      background: #e2e8f0;
      color: #334155;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .btn-secundario:hover { background: #cbd5e1; }

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
export class CatalogoPiezasComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  categorias = ['Frenos', 'Suspensión', 'Turbo', 'General'];

  piezas: PiezaItem[] = [];
  proveedores: ProveedorItem[] = [];

  id: number | null = null;
  codigo = '';
  nombre = '';
  marca = '';
  categoria = 'Frenos';
  stock: number | null = 0;
  precio: number | null = null;
  proveedorId: number | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }

  ngOnInit() { this.cargar(); }

  cargar() {
    forkJoin({
      piezas: this.http.get<PiezaItem[]>(`${API_URL}/piezas`),
      proveedores: this.http.get<ProveedorItem[]>(`${API_URL}/proveedores`)
    }).subscribe({
      next: r => {
        this.piezas = r.piezas;
        this.proveedores = r.proveedores;
        if (this.proveedorId == null && r.proveedores.length) this.proveedorId = r.proveedores[0].id;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo cargar el catálogo.'), true)
    });
  }

  nombreProveedor(id: number): string {
    return this.proveedores.find(p => p.id === id)?.nombre ?? `Proveedor #${id}`;
  }

  editar(p: PiezaItem) {
    this.id = p.id;
    this.codigo = p.codigo;
    this.nombre = p.nombre;
    this.marca = p.marca;
    this.categoria = p.categoria;
    this.stock = p.stock;
    this.precio = p.precioUnitario;
    this.proveedorId = p.proveedorId;
    this.mensaje = '';
  }

  limpiar() {
    this.id = null;
    this.codigo = '';
    this.nombre = '';
    this.marca = '';
    this.categoria = 'Frenos';
    this.stock = 0;
    this.precio = null;
    this.proveedorId = this.proveedores.length ? this.proveedores[0].id : null;
  }

  guardar() {
    if (this.proveedorId == null) {
      this.mostrar('Selecciona un proveedor.', true);
      return;
    }
    const cuerpo = {
      codigo: this.codigo, nombre: this.nombre, marca: this.marca, categoria: this.categoria,
      stock: Number(this.stock ?? 0), precioUnitario: Number(this.precio ?? 0),
      proveedorId: this.proveedorId
    };
    const eraNueva = this.id == null;
    const peticion = eraNueva
      ? this.http.post<PiezaItem>(`${API_URL}/piezas`, cuerpo)
      : this.http.put<PiezaItem>(`${API_URL}/piezas/${this.id}`, cuerpo);

    peticion.subscribe({
      next: p => {
        this.mostrar(eraNueva ? `Pieza "${p.nombre}" registrada.` : `Pieza "${p.nombre}" actualizada.`, false);
        this.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo guardar la pieza.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}