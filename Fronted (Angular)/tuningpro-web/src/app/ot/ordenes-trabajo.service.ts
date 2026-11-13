import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface RepuestoOrden {
  id: number; piezaId: number; piezaCodigo: string; piezaNombre: string;
  cantidad: number; precioUnitario: number;
}

export interface OrdenTrabajo {
  id: number; proyectoId: number; proyectoCodigo: string; clienteNombre: string;
  vehiculoDescripcion: string; vehiculoPlaca: string; tecnicoNombre: string;
  problemasReportados: string[]; repuestos: RepuestoOrden[]; manoObra: number;
  observaciones: string; fechaCreacion: string;
  estado: 'Registrado' | 'En proceso' | 'Finalizado';
}

export interface TecnicoOpcion { id: number; nombreCompleto: string; }

export interface PiezaCompatible {
  id: number; codigo: string; nombre: string; precioUnitario: number; stock: number;
}

export interface DatosNuevaOrden {
  numeroSugerido: number; codigoSugerido: string;
  proyectoId: number; proyectoCodigo: string; clienteNombre: string;
  vehiculoDescripcion: string; vehiculoPlaca: string;
  problemasReportados: string[];
  tecnicos: TecnicoOpcion[];
  repuestosCompatibles: PiezaCompatible[];
}

export interface RepuestoSeleccionado { piezaId: number; cantidad: number; }

export interface CrearOrdenTrabajo {
  proyectoId: number; tecnicoId: number; manoObra: number; observaciones: string;
  repuestos: RepuestoSeleccionado[];
}

@Injectable({ providedIn: 'root' })
export class OrdenesTrabajoService {
  private readonly baseUrl = `${API_URL}/ordenes-trabajo`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdenTrabajo[]> {
    return this.http.get<OrdenTrabajo[]>(this.baseUrl);
  }

  getById(id: number): Observable<OrdenTrabajo> {
    return this.http.get<OrdenTrabajo>(`${this.baseUrl}/${id}`);
  }

  obtenerDatosNueva(proyectoId: number): Observable<DatosNuevaOrden> {
    return this.http.get<DatosNuevaOrden>(`${this.baseUrl}/nueva/${proyectoId}`);
  }

  crear(dto: CrearOrdenTrabajo): Observable<OrdenTrabajo> {
    return this.http.post<OrdenTrabajo>(this.baseUrl, dto);
  }

  cambiarEstado(id: number, estado: string): Observable<OrdenTrabajo> {
    return this.http.put<OrdenTrabajo>(`${this.baseUrl}/${id}/estado`, { estado });
  }
}

export function subtotalRepuestos(repuestos: { cantidad: number; precioUnitario: number }[]): number {
  return repuestos.reduce((acc, r) => acc + r.cantidad * r.precioUnitario, 0);
}
export function igv(subtotal: number): number {
  return Math.round(subtotal * 0.18 * 100) / 100;
}
export function totalGeneral(subtotal: number, manoObra: number): number {
  return subtotal + igv(subtotal) + manoObra;
}