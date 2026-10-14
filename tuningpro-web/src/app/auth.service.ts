import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.config';

export interface Sesion {
  token: string;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
  expira: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private clave = 'tuningpro_sesion';
  sesion: Sesion | null = null;

  constructor(private http: HttpClient) {
    const guardada = sessionStorage.getItem(this.clave);
    if (guardada) {
      try {
        const s: Sesion = JSON.parse(guardada);
        if (new Date(s.expira) > new Date()) this.sesion = s;
        else sessionStorage.removeItem(this.clave);
      } catch {
        sessionStorage.removeItem(this.clave);
      }
    }
  }

  login(usuario: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${API_URL}/auth/login`, { usuario, password }).pipe(
      tap(s => {
        this.sesion = s;
        sessionStorage.setItem(this.clave, JSON.stringify(s));
      })
    );
  }

  logout() {
    this.sesion = null;
    sessionStorage.removeItem(this.clave);
  }

  get logueado(): boolean { return this.sesion !== null; }
  get token(): string | null { return this.sesion?.token ?? null; }
  get rol(): string { return this.sesion?.rol ?? ''; }

  puede(...roles: string[]): boolean {
    return roles.includes(this.rol);
  }
}