import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Vehiculo {
  id: number; placa: string; marca: string; modelo: string; anio: number; clienteNombre: string;
}

export interface Pieza {
  id: number; codigo: string; nombre: string; marca: string;
  categoria: string; stock: number; precioUnitario: number;
}

export interface DetalleProyecto {
  id: number; proyectoId: number; piezaId: number; cantidad: number; precioUnitario: number;
}

export interface Proyecto {
  id: number; nombre: string; vehiculoId: number; estado: string;
  fechaRegistro: string; detalles: DetalleProyecto[];
}

export interface ResultadoValidacion {
  esCompatible: boolean; mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class PiezasService {
  private api = 'http://localhost:5260/api'; // <-- ESTE ES EL PUERTO

  constructor(private http: HttpClient) {}

  getVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.api}/vehiculos`);
  }

  getPiezas(): Observable<Pieza[]> {
    return this.http.get<Pieza[]>(`${this.api}/piezas`);
  }

  getAlertas(): Observable<Pieza[]> {
    return this.http.get<Pieza[]>(`${this.api}/piezas/alertas`);
  }

  movimiento(piezaId: number, cantidad: number, esEntrada: boolean): Observable<Pieza> {
    return this.http.post<Pieza>(`${this.api}/piezas/${piezaId}/movimiento`, { cantidad, esEntrada });
  }

  validar(vehiculoId: number, piezaId: number): Observable<ResultadoValidacion> {
    return this.http.get<ResultadoValidacion>(
      `${this.api}/compatibilidad/validar?vehiculoId=${vehiculoId}&piezaId=${piezaId}`
    );
  }

  getProyectos(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.api}/proyectos`);
  }

  crearProyecto(nombre: string, vehiculoId: number): Observable<Proyecto> {
    return this.http.post<Proyecto>(`${this.api}/proyectos`, { nombre, vehiculoId });
  }

  asignarPieza(proyectoId: number, piezaId: number, cantidad: number): Observable<Proyecto> {
    return this.http.post<Proyecto>(`${this.api}/proyectos/${proyectoId}/piezas`, { piezaId, cantidad });
  }

  cambiarEstado(proyectoId: number, estado: string): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.api}/proyectos/${proyectoId}/estado`, { estado });
  }
}