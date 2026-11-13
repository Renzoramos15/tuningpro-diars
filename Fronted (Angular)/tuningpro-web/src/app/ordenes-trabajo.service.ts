import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export interface RepuestoOrden {
  id: number;
  piezaId: number;
  piezaCodigo: string;
  piezaNombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenTrabajo {
  id: number;
  proyectoId: number;
  proyectoCodigo: string;
  clienteNombre: string;
  vehiculoDescripcion: string;
  vehiculoPlaca: string;
  tecnicoNombre: string;
  problemasReportados: string[];
  repuestos: RepuestoOrden[];
  manoObra: number;
  observaciones: string;
  fechaCreacion: string;
  estado: 'Registrado' | 'En proceso' | 'Finalizado';
}

@Injectable({ providedIn: 'root' })
export class OrdenesTrabajoService {
  private api = API_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdenTrabajo[]> {
    return this.http.get<OrdenTrabajo[]>(`${this.api}/ordenes-trabajo`);
  }

  getById(id: number): Observable<OrdenTrabajo> {
    return this.http.get<OrdenTrabajo>(`${this.api}/ordenes-trabajo/${id}`);
  }

  cambiarEstado(id: number, estado: string): Observable<OrdenTrabajo> {
    return this.http.put<OrdenTrabajo>(`${this.api}/ordenes-trabajo/${id}/estado`, { estado });
  }
}

export function subtotalRepuestos(o: OrdenTrabajo): number {
  return o.repuestos.reduce((s, r) => s + r.cantidad * r.precioUnitario, 0);
}
export function igv(o: OrdenTrabajo): number {
  return subtotalRepuestos(o) * 0.18;
}
export function totalGeneral(o: OrdenTrabajo): number {
  return subtotalRepuestos(o) + igv(o) + (o.manoObra ?? 0);
}
export function codigoOt(id: number): string {
  return 'OT-' + String(id).padStart(6, '0');
}