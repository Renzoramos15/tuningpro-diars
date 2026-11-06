import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { mensajeError } from './errores';

interface VehiculoItem {
  id: number; placa: string; marca: string; modelo: string; anio: number;
  clienteNombre: string; usuarioId: number | null;
}
interface ClienteCuenta { id: number; nombreUsuario: string; nombreCompleto: string; }

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3>Vehículos</h3>

    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>

    <div class="formulario" *ngIf="puedeEditar">
      <strong>{{ id == null ? 'Nuevo vehículo' : 'Editando vehículo N° ' + id }}</strong>
      <div class="fila">
        <label>Placa
          <input type="text" [(ngModel)]="placa" placeholder="ABC-123" class="num" />
        </label>
        <label>Marca
          <input type="text" [(ngModel)]="marca" />
        </label>
        <label>Modelo
          <input type="text" [(ngModel)]="modelo" />
        </label>
        <label>Año
          <input type="number" min="1950" [(ngModel)]="anio" class="num" />
        </label>
        <label>Nombre del cliente
          <input type="text" [(ngModel)]="clienteNombre" />
        </label>
        <label>Cuenta del portal
          <select [(ngModel)]="usuarioId">
            <option [ngValue]="null">Sin cuenta de portal</option>
            <option *ngFor="let c of clientes" [ngValue]="c.id">{{ c.nombreCompleto }} ({{ c.nombreUsuario }})</option>
          </select>
        </label>
        <button (click)="guardar()">{{ id == null ? 'Registrar' : 'Guardar cambios' }}</button>
        <button *ngIf="id != null" (click)="limpiar()">Cancelar</button>
      </div>
      <p class="nota">La cuenta del portal permite que el cliente vea este vehículo y sus proyectos al iniciar sesión.</p>
    </div>

    <div class="fila">
      <label>Buscar por placa, marca, modelo o cliente
        <input type="text" [(ngModel)]="buscar" (keyup.enter)="cargar()" placeholder="Ej. Torres" />
      </label>
      <button (click)="cargar()">Buscar</button>
      <button (click)="limpiarBusqueda()" *ngIf="buscar">Limpiar</button>
    </div>

    <p class="nota" *ngIf="vehiculos.length === 0">No se encontraron vehículos.</p>
    <div class="tabla-scroll" *ngIf="vehiculos.length > 0">
      <table>
        <tr>
          <th>Placa</th><th>Vehículo</th><th>Año</th><th>Cliente</th><th>Cuenta del portal</th>
          <th *ngIf="puedeEditar">Acción</th>
        </tr>
        <tr *ngFor="let v of vehiculos">
          <td>{{ v.placa }}</td>
          <td>{{ v.marca }} {{ v.modelo }}</td>
          <td>{{ v.anio }}</td>
          <td>{{ v.clienteNombre }}</td>
          <td>
            <span *ngIf="v.usuarioId != null" class="etiqueta">{{ cuenta(v) }}</span>
            <span *ngIf="v.usuarioId == null" class="sin-cuenta">Sin cuenta</span>
          </td>
          <td *ngIf="puedeEditar"><button (click)="editar(v)">Editar</button></td>
        </tr>
      </table>
    </div>
  `
})
export class VehiculosComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  vehiculos: VehiculoItem[] = [];
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

    this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`, { params }).subscribe({
      next: v => (this.vehiculos = v),
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
    });
  }

  limpiarBusqueda() {
    this.buscar = '';
    this.cargar();
  }

  cuenta(v: VehiculoItem): string {
    const c = this.clientes.find(x => x.id === v.usuarioId);
    return c ? c.nombreUsuario : 'Vinculado';
  }

  editar(v: VehiculoItem) {
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
      ? this.http.post<VehiculoItem>(`${API_URL}/vehiculos`, cuerpo)
      : this.http.put<VehiculoItem>(`${API_URL}/vehiculos/${this.id}`, cuerpo);

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