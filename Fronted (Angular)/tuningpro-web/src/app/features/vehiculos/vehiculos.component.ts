import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { Vehiculo, ClienteCuenta } from '../../core/models';
import { AvisoComponent } from '../../shared/components/aviso.component';
import { VehiculoFormComponent, DatosVehiculo } from './vehiculo-form/vehiculo-form.component';
import { VehiculoListComponent } from './vehiculo-list/vehiculo-list.component';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, AvisoComponent, VehiculoFormComponent, VehiculoListComponent],
  template: `
    <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-bottom: 16px;">Vehículos</h3>

    <app-aviso [mensaje]="mensaje" [esError]="esError"></app-aviso>

    <app-vehiculo-form
      *ngIf="puedeEditar"
      [clientes]="clientes"
      [vehiculo]="editando"
      (guardar)="guardar($event)"
      (cancelar)="cancelarEdicion()">
    </app-vehiculo-form>

    <app-vehiculo-list
      [vehiculos]="vehiculos"
      [clientes]="clientes"
      [puedeEditar]="puedeEditar"
      (buscar)="buscar($event)"
      (editar)="editar($event)">
    </app-vehiculo-list>
  `
})
export class VehiculosComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();
  @ViewChild(VehiculoFormComponent) formulario?: VehiculoFormComponent;

  vehiculos: Vehiculo[] = [];
  clientes: ClienteCuenta[] = [];
  textoBusqueda = '';
  editando: Vehiculo | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

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
    if (this.textoBusqueda) params['buscar'] = this.textoBusqueda;

    this.http.get<Vehiculo[]>(`${API_URL}/vehiculos`, { params }).subscribe({
      next: v => (this.vehiculos = v),
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
    });
  }

  buscar(texto: string) {
    this.textoBusqueda = texto;
    this.cargar();
  }

  editar(v: Vehiculo) {
    this.editando = { ...v };   // copia nueva: así el formulario se llena aunque sea el mismo vehículo
    this.mensaje = '';
  }

  cancelarEdicion() {
    this.editando = null;
    this.mensaje = '';
  }

  guardar(e: { id: number | null; datos: DatosVehiculo }) {
    const eraNuevo = e.id == null;
    const peticion = eraNuevo
      ? this.http.post<Vehiculo>(`${API_URL}/vehiculos`, e.datos)
      : this.http.put<Vehiculo>(`${API_URL}/vehiculos/${e.id}`, e.datos);

    peticion.subscribe({
      next: v => {
        this.mostrar(eraNuevo ? `Vehículo ${v.placa} registrado.` : `Vehículo ${v.placa} actualizado.`, false);
        this.editando = null;
        this.formulario?.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: err => this.mostrar(mensajeError(err, 'No se pudo guardar el vehículo.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}