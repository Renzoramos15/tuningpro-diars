import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import {
  Cliente, Problema, Proyecto, ProyectoCrear, ProyectoNuevoInfo, Vehiculo
} from '../models/proyecto.model';

const API = API_URL;

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private http = inject(HttpClient);

  info(): Observable<ProyectoNuevoInfo> {
    return this.http.get<ProyectoNuevoInfo>(`${API}/proyectos/nuevo`);
  }
  problemas(): Observable<Problema[]> {
    return this.http.get<Problema[]>(`${API}/proyectos/problemas`);
  }
  listar(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${API}/proyectos`);
  }
  crear(dto: ProyectoCrear): Observable<Proyecto> {
    return this.http.post<Proyecto>(`${API}/proyectos`, dto);
  }
  clientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${API}/clientes`);
  }
  vehiculos(clienteId: number): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${API}/clientes/${clienteId}/vehiculos`);
  }
  obtener(id: number): Observable<Proyecto> {
  return this.http.get<Proyecto>(`${API}/proyectos/${id}`);
}
}