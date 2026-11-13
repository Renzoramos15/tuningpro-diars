import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { Vehiculo, ClienteCuenta } from '../../core/models';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-bottom: 16px;">Vehículos</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <!-- Formulario de Registro / Edición -->
    <div class="formulario-card" *ngIf="puedeEditar">
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
        <button class="btn-azul" (click)="guardar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button class="btn-secundario" *ngIf="id != null" (click)="limpiar()">Cancelar</button>
      </div>

      <p class="nota" style="margin-top: 12px;">La cuenta del portal permite que el cliente vea este vehículo y sus proyectos al iniciar sesión.</p>
    </div>

    <!-- Barra de Búsqueda -->
    <div class="fila" style="margin-bottom: 16px; align-items: flex-end;">
      <label style="flex: 3; min-width: 260px;">
        Buscar por placa, marca, modelo o cliente
        <input type="text" [(ngModel)]="buscar" (keyup.enter)="cargar()" placeholder="Ej. Torres" class="input-amplio" />
      </label>
      <div style="display: flex; gap: 8px;">
        <button class="btn-azul" (click)="cargar()">Buscar</button>
        <button class="btn-secundario" (click)="limpiarBusqueda()" *ngIf="buscar">Limpiar</button>
      </div>
    </div>

    <p class="nota" *ngIf="vehiculos.length === 0">No se encontraron vehículos.</p>

    <!-- Tabla Moderna -->
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
              <span *ngIf="v.usuarioId == null" class="sin-cuenta" style="color: #94a3b8; font-size: 13px;">Sin cuenta</span>
            </td>
            <td *ngIf="puedeEditar">
              <button class="btn-azul" style="padding: 6px 12px; font-size: 12px;" (click)="editar(v)">Editar</button>
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

    .etiqueta {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      display: inline-block;
    }

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
export class VehiculosComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  vehiculos: Vehiculo[] = [];
  clientes: ClienteCuenta[] = [];
  buscar = '';

  id: number | null = null;
  placa = '';
  marca = '';
  modelo = '';
  anio: number | null = null;
  clienteNombre = '';
  usuarioId: number | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Recepcionista'); }

  ngOnInit() {
    this.cargar();
    if (this.puedeEditar) {
      this.http.get<ClienteCuenta[]>(`${API_URL}/vehiculos/clientes`).subscribe({
        next: c => (this.clientes = c),
        error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar las cuentas de cliente.'), true)
      });
    }
  }

  cargar() {
    const params: Record<string, string> = {};
    if (this.buscar.trim()) params['buscar'] = this.buscar.trim();

    this.http.get<Vehiculo[]>(`${API_URL}/vehiculos`, { params }).subscribe({
      next: v => (this.vehiculos = v),
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
    });
  }

  limpiarBusqueda() {
    this.buscar = '';
    this.cargar();
  }

  cuenta(v: Vehiculo): string {
    const c = this.clientes.find(x => x.id === v.usuarioId);
    return c ? c.nombreUsuario : 'Vinculado';
  }

  editar(v: Vehiculo) {
    this.id = v.id;
    this.placa = v.placa;
    this.marca = v.marca;
    this.modelo = v.modelo;
    this.anio = v.anio;
    this.clienteNombre = v.clienteNombre;
    this.usuarioId = v.usuarioId;
    this.mensaje = '';
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

  guardar() {
    const cuerpo = {
      placa: this.placa, marca: this.marca, modelo: this.modelo,
      anio: Number(this.anio ?? 0), clienteNombre: this.clienteNombre,
      usuarioId: this.usuarioId
    };
    const eraNuevo = this.id == null;
    const peticion = eraNuevo
      ? this.http.post<Vehiculo>(`${API_URL}/vehiculos`, cuerpo)
      : this.http.put<Vehiculo>(`${API_URL}/vehiculos/${this.id}`, cuerpo);

    peticion.subscribe({
      next: v => {
        this.mostrar(eraNuevo ? `Vehículo ${v.placa} registrado.` : `Vehículo ${v.placa} actualizado.`, false);
        this.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo guardar el vehículo.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}