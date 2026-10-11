import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pieza {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  categoria: string;
  stock: number;
  precioUnitario: number;
}

export interface ResultadoValidacion {
  esCompatible: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class PiezasService {
  private api = 'http://localhost:5260/api'; // <-- CAMBIALO POR TU PUERTO

  constructor(private http: HttpClient) {}

  getPiezas(): Observable<Pieza[]> {
    return this.http.get<Pieza[]>(`${this.api}/piezas`);
  }

  validar(vehiculoId: number, piezaId: number): Observable<ResultadoValidacion> {
    return this.http.get<ResultadoValidacion>(
      `${this.api}/compatibilidad/validar?vehiculoId=${vehiculoId}&piezaId=${piezaId}`
    );
  }
}