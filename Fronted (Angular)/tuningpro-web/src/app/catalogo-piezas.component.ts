import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { mensajeError } from './errores';

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
    <h3>Catálogo de piezas</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <div class="formulario" *ngIf="puedeEditar">
      <strong>{{ id == null ? 'Nueva pieza' : 'Editando pieza N° ' + id }}</strong>
      <div class="fila">
        <label>Código
          <input type="text" [(ngModel)]="codigo" placeholder="BRM-002" class="num" />
        </label>
        <label>Nombre
          <input type="text" [(ngModel)]="nombre" />
        </label>
        <label>Marca
          <input type="text" [(ngModel)]="marca" />
        </label>
        <label>Categoría
          <select [(ngModel)]="categoria">
            <option *ngFor="let c of categorias" [ngValue]="c">{{ c }}</option>
          </select>
        </label>
        <label>Stock inicial
          <input type="number" min="0" [(ngModel)]="stock" [disabled]="id != null" class="num" />
        </label>
        <label>Precio (S/)
          <input type="number" min="0" step="0.01" [(ngModel)]="precio" class="num" />
        </label>
        <label>Proveedor
          <select [(ngModel)]="proveedorId">
            <option [ngValue]="null" disabled>Proveedor...</option>
            <option *ngFor="let p of proveedores" [ngValue]="p.id">{{ p.nombre }}</option>
          </select>
        </label>
        <button (click)="guardar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button *ngIf="id != null" (click)="limpiar()">Cancelar</button>
      </div>
      <p class="nota" *ngIf="id != null">
        El stock no se edita aquí: se modifica con "+ Entrada" en el inventario o al asignar piezas a proyectos.
      </p>
    </div>

    <p class="nota" *ngIf="piezas.length === 0">Aún no hay piezas registradas.</p>
    <div class="tabla-scroll" *ngIf="piezas.length > 0">
      <table>
        <tr>
          <th>Código</th><th>Nombre</th><th>Marca</th><th>Categoría</th>
          <th>Proveedor</th><th>Stock</th><th>Precio</th><th *ngIf="puedeEditar">Acción</th>
        </tr>
        <tr *ngFor="let p of piezas">
          <td>{{ p.codigo }}</td>
          <td>{{ p.nombre }}</td>
          <td>{{ p.marca }}</td>
          <td>{{ p.categoria }}</td>
          <td>{{ nombreProveedor(p.proveedorId) }}</td>
          <td>{{ p.stock }}</td>
          <td>S/ {{ p.precioUnitario | number:'1.2-2' }}</td>
          <td *ngIf="puedeEditar"><button (click)="editar(p)">Editar</button></td>
        </tr>
      </table>
    </div>
  `
})
export class CatalogoPiezasComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  // Deben coincidir con las categorías de las estrategias de compatibilidad
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