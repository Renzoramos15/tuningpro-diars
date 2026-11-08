import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { mensajeError } from './errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; clienteNombre: string; }

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="gestion">
      <h2>Reportes (PDF)</h2>

      <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
        {{ esError ? '❌' : '✅' }} {{ mensaje }}
      </div>

      <div class="tarjetas">

        <div class="tarjeta" *ngIf="puedeInventario">
          <strong>📦 Inventario de piezas</strong>
          <p class="nota">Stock actual, valor del inventario y piezas con stock bajo.</p>
          <div class="fila">
            <button (click)="generar('inventario', '/reportes/inventario', 'inventario', false)" [disabled]="ocupado !== null">
              {{ ocupado === 'inventario' ? 'Generando...' : 'Descargar PDF' }}
            </button>
            <button (click)="generar('inventario', '/reportes/inventario', 'inventario', true)" [disabled]="ocupado !== null">
              Ver
            </button>
          </div>
        </div>

        <div class="tarjeta" *ngIf="puedeProyectos">
          <strong>🛠 Proyectos y órdenes</strong>
          <p class="nota">Todos los proyectos con su estado, orden de trabajo y total.</p>
          <div class="fila">
            <button (click)="generar('proyectos', '/reportes/proyectos', 'proyectos', false)" [disabled]="ocupado !== null">
              {{ ocupado === 'proyectos' ? 'Generando...' : 'Descargar PDF' }}
            </button>
            <button (click)="generar('proyectos', '/reportes/proyectos', 'proyectos', true)" [disabled]="ocupado !== null">
              Ver
            </button>
          </div>
        </div>

        <div class="tarjeta">
          <strong>🚗 Historial técnico del vehículo</strong>
          <p class="nota">Trazabilidad completa de las modificaciones de un vehículo.</p>
          <label>Vehículo
            <select [(ngModel)]="vehiculoId">
              <option [ngValue]="null" disabled>Selecciona un vehículo...</option>
              <option *ngFor="let v of vehiculos" [ngValue]="v.id">
                {{ v.marca }} {{ v.modelo }} ({{ v.placa }})
              </option>
            </select>
          </label>
          <div class="fila">
            <button (click)="generarHistorial(false)" [disabled]="ocupado !== null || vehiculoId == null">
              {{ ocupado === 'historial' ? 'Generando...' : 'Descargar PDF' }}
            </button>
            <button (click)="generarHistorial(true)" [disabled]="ocupado !== null || vehiculoId == null">
              Ver
            </button>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .tarjetas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
    .tarjeta { flex: 1; min-width: 250px; border: 1px solid #bbb; border-radius: 8px; padding: 12px 14px;
               background: #fafafa; display: flex; flex-direction: column; gap: 4px; }
  `]
})
export class ReportesComponent implements OnInit {
  vehiculos: VehiculoItem[] = [];
  vehiculoId: number | null = null;

  ocupado: string | null = null;
  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeInventario(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }
  get puedeProyectos(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista'); }

  ngOnInit() {
    this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`).subscribe({
      next: v => {
        this.vehiculos = v;
        if (v.length) this.vehiculoId = v[0].id;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
    });
  }

  generarHistorial(abrir: boolean) {
    if (this.vehiculoId == null) return;
    const v = this.vehiculos.find(x => x.id === this.vehiculoId);
    const nombre = 'historial-' + (v?.placa ?? 'vehiculo');
    this.generar('historial', `/reportes/historial/${this.vehiculoId}`, nombre, abrir);
  }

  generar(clave: string, ruta: string, nombre: string, abrir: boolean) {
    this.mensaje = '';
    this.ocupado = clave;
    // Se abre la pestaña de inmediato (con el clic) para que el navegador no la bloquee
    const ventana = abrir ? window.open('', '_blank') : null;

    this.http.get(`${API_URL}${ruta}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        this.ocupado = null;
        const url = URL.createObjectURL(blob);

        if (ventana) {
          ventana.location.href = url;
        } else {
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `${nombre}-${this.fechaHoy()}.pdf`;
          enlace.click();
        }

        this.mostrar(ventana ? 'Reporte generado.' : 'Reporte descargado.', false);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: async e => {
        this.ocupado = null;
        ventana?.close();

        let texto = mensajeError(e, 'No se pudo generar el reporte.');
        // Con responseType blob, el mensaje de error de la API llega dentro de un Blob
        if (e?.error instanceof Blob) {
          try {
            const cuerpo = JSON.parse(await e.error.text());
            if (cuerpo?.mensaje) texto = cuerpo.mensaje;
          } catch { /* se deja el mensaje por defecto */ }
        }
        this.mostrar(texto, true);
      }
    });
  }

  private fechaHoy(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}