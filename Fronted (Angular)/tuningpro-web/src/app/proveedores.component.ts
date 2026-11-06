import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { mensajeError } from './errores';

interface ProveedorItem { id: number; nombre: string; contacto: string; }

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3>Proveedores</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <div class="formulario" *ngIf="puedeEditar">
      <strong>{{ id == null ? 'Nuevo proveedor' : 'Editando proveedor N° ' + id }}</strong>
      <div class="fila">
        <label>Nombre
          <input type="text" [(ngModel)]="nombre" placeholder="Ej. Brembo" />
        </label>
        <label>Contacto
          <input type="text" [(ngModel)]="contacto" placeholder="Correo o teléfono" />
        </label>
        <button (click)="guardar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button *ngIf="id != null" (click)="limpiar()">Cancelar</button>
      </div>
    </div>

    <p class="nota" *ngIf="proveedores.length === 0">Aún no hay proveedores registrados.</p>
    <div class="tabla-scroll" *ngIf="proveedores.length > 0">
      <table>
        <tr><th>N°</th><th>Nombre</th><th>Contacto</th><th *ngIf="puedeEditar">Acción</th></tr>
        <tr *ngFor="let p of proveedores">
          <td>{{ p.id }}</td>
          <td>{{ p.nombre }}</td>
          <td>{{ p.contacto }}</td>
          <td *ngIf="puedeEditar"><button (click)="editar(p)">Editar</button></td>
        </tr>
      </table>
    </div>
  `
})
export class ProveedoresComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  proveedores: ProveedorItem[] = [];
  id: number | null = null;
  nombre = '';
  contacto = '';

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }

  ngOnInit() { this.cargar(); }

  cargar() {
    this.http.get<ProveedorItem[]>(`${API_URL}/proveedores`).subscribe({
      next: p => (this.proveedores = p),
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los proveedores.'), true)
    });
  }

  editar(p: ProveedorItem) {
    this.id = p.id;
    this.nombre = p.nombre;
    this.contacto = p.contacto;
    this.mensaje = '';
  }

  limpiar() {
    this.id = null;
    this.nombre = '';
    this.contacto = '';
  }

  guardar() {
    const cuerpo = { nombre: this.nombre, contacto: this.contacto };
    const eraNuevo = this.id == null;
    const peticion = eraNuevo
      ? this.http.post<ProveedorItem>(`${API_URL}/proveedores`, cuerpo)
      : this.http.put<ProveedorItem>(`${API_URL}/proveedores/${this.id}`, cuerpo);

    peticion.subscribe({
      next: p => {
        this.mostrar(eraNuevo ? `Proveedor "${p.nombre}" registrado.` : `Proveedor "${p.nombre}" actualizado.`, false);
        this.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo guardar el proveedor.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}