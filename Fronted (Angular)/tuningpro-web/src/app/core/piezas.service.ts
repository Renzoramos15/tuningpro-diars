import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Vehiculo, Pieza, Proyecto, ResultadoValidacion } from './models';

export * from './models';

@Injectable({ providedIn: 'root' })
export class PiezasService {
  private api = API_URL;

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
  
  getTransiciones(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(`${this.api}/proyectos/transiciones`);
  }
}