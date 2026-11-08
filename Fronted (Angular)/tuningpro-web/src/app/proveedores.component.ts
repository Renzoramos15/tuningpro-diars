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
    <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-bottom: 16px;">Proveedores</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <!-- Formulario de Registro / Edición -->
    <div class="formulario-card" *ngIf="puedeEditar">
      <strong style="color: #1e3a8a; font-size: 14px; display: block; margin-bottom: 12px;">
        {{ id == null ? 'Nuevo proveedor' : 'Editando proveedor N° ' + id }}
      </strong>
      
      <div class="fila">
        <label style="flex: 2; min-width: 220px;">
          Nombre
          <input type="text" [(ngModel)]="nombre" placeholder="Ej. Brembo" class="input-amplio" />
        </label>
        <label style="flex: 3; min-width: 260px;">
          Contacto
          <input type="text" [(ngModel)]="contacto" placeholder="Correo o teléfono" class="input-amplio" />
        </label>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px; align-items: center;">
        <button class="btn-azul" (click)="guardar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button class="btn-secundario" *ngIf="id != null" (click)="limpiar()">Cancelar</button>
      </div>
    </div>

    <p class="nota" *ngIf="proveedores.length === 0">Aún no hay proveedores registrados.</p>

    <!-- Tabla Moderna -->
    <div class="tabla-scroll" *ngIf="proveedores.length > 0">
      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Nombre</th>
            <th>Contacto</th>
            <th *ngIf="puedeEditar">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of proveedores">
            <td><strong style="color: #1d4ed8;">{{ p.id }}</strong></td>
            <td><strong>{{ p.nombre }}</strong></td>
            <td style="color: #475569;">{{ p.contacto }}</td>
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