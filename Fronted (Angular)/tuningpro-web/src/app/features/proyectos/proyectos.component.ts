import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PiezasService } from '../../core/piezas.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { Pieza, Proyecto, Vehiculo } from '../../core/models';
import { AvisoComponent } from '../../shared/components/aviso.component';


@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, AvisoComponent],
  template: `
    <app-aviso [mensaje]="mensaje" [esError]="esError"></app-aviso>

    <section>
      <h2>Nuevo proyecto de personalización</h2>
      <div class="fila">
        <input type="text" placeholder="Nombre (ej. Stage 1)" [(ngModel)]="nuevoNombre" />
        <select [(ngModel)]="nuevoVehiculoId">
          <option *ngFor="let v of vehiculos" [ngValue]="v.id">
            {{ v.marca }} {{ v.modelo }} ({{ v.placa }})
          </option>
        </select>
        <button (click)="crearProyecto()">Crear proyecto</button>
      </div>
    </section>

    <section *ngIf="puedeAsignar">
      <h2>Asignar pieza a un proyecto</h2>
      <p class="nota">El sistema valida la compatibilidad y descuenta el stock automáticamente.</p>
      <div class="fila">
        <select [(ngModel)]="asignacion.proyectoId">
          <option [ngValue]="null" disabled>Proyecto...</option>
          <option *ngFor="let pr of proyectosAbiertos" [ngValue]="pr.id">
            N° {{ pr.id }} - {{ pr.nombre }} ({{ pr.estado }})
          </option>
        </select>
        <select [(ngModel)]="asignacion.piezaId">
          <option [ngValue]="null" disabled>Pieza...</option>
          <option *ngFor="let p of piezas" [ngValue]="p.id">
            {{ p.nombre }} (stock {{ p.stock }})
          </option>
        </select>
        <input type="number" min="1" [(ngModel)]="asignacion.cantidad" class="num" />
        <button (click)="asignarPieza()">Asignar</button>
      </div>
    </section>

    <section>
      <h2>Proyectos registrados</h2>
      <p *ngIf="proyectos.length === 0" class="nota">Aún no hay proyectos.</p>

      <div class="tabla-scroll" *ngIf="proyectos.length > 0">
        <table>
          <tr>
            <th>N°</th><th>Proyecto</th><th>Vehículo</th><th>Estado</th>
            <th>Fecha</th><th>Piezas instaladas</th><th>Total</th>
            <th *ngIf="puedeAsignar">Acción</th>
          </tr>
          <tr *ngFor="let pr of proyectos">
            <td>{{ pr.id }}</td>
            <td>{{ pr.nombre }}</td>
            <td>{{ textoVehiculo(pr.vehiculoId) }}</td>
            <td><span class="estado" [attr.data-estado]="pr.estado">{{ pr.estado }}</span></td>
            <td>{{ pr.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              <span *ngIf="pr.detalles.length === 0">—</span>
              <div *ngFor="let d of pr.detalles">
                {{ d.cantidad }} × {{ d.piezaNombre }}
              </div>
            </td>
            <td>S/ {{ totalProyecto(pr) | number:'1.2-2' }}</td>
            <td *ngIf="puedeAsignar">
              <ng-container *ngIf="opcionesEstado(pr).length > 0; else estadoFinal">
                <select [(ngModel)]="nuevoEstado[pr.id]">
                  <option value="">Cambiar a...</option>
                  <option *ngFor="let e of opcionesEstado(pr)" [value]="e">{{ e }}</option>
                </select>
                <button (click)="cambiarEstado(pr)">Aplicar</button>
              </ng-container>
              <ng-template #estadoFinal><span class="nota">Estado final</span></ng-template>
            </td>
          </tr>
        </table>
      </div>
    </section>
  `,
  styleUrl: '../../shared/estilos-panel.css'
})
export class ProyectosComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  piezas: Pieza[] = [];
  proyectos: Proyecto[] = [];
  transiciones: Record<string, string[]> = {};
  nuevoEstado: Record<number, string> = {};

  nuevoNombre = '';
  nuevoVehiculoId = 1;
  asignacion: { proyectoId: number | null; piezaId: number | null; cantidad: number } = {
    proyectoId: null, piezaId: null, cantidad: 1
  };

  mensaje = '';
  esError = false;

  constructor(private service: PiezasService, private auth: AuthService) {}

  get puedeAsignar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }

  ngOnInit() {
    this.service.getVehiculos().subscribe({
      next: v => {
        this.vehiculos = v;
        if (v.length) this.nuevoVehiculoId = v[0].id;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo conectar con la API.'), true)
    });
    this.recargarProyectos();

    if (this.puedeAsignar) {
      this.recargarPiezas();
      this.service.getTransiciones().subscribe({ next: t => (this.transiciones = t) });
    }
  }

  private recargarPiezas() {
    this.service.getPiezas().subscribe({
      next: p => {
        this.piezas = p;
        if (this.asignacion.piezaId == null && p.length) this.asignacion.piezaId = p[0].id;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar las piezas.'), true)
    });
  }

  private recargarProyectos() {
    this.service.getProyectos().subscribe({
      next: p => {
        this.proyectos = p;
        p.forEach(x => { if (this.nuevoEstado[x.id] === undefined) this.nuevoEstado[x.id] = ''; });

        const abiertos = this.proyectosAbiertos;
        if (!abiertos.some(x => x.id === this.asignacion.proyectoId)) {
          this.asignacion.proyectoId = abiertos.length ? abiertos[0].id : null;
        }
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los proyectos.'), true)
    });
  }

  crearProyecto() {
    const nombre = this.nuevoNombre.trim();
    if (!nombre) {
      this.mostrar('Escribe un nombre para el proyecto.', true);
      return;
    }
    this.service.crearProyecto(nombre, Number(this.nuevoVehiculoId)).subscribe({
      next: p => {
        this.nuevoNombre = '';
        this.asignacion.proyectoId = p.id;
        this.mostrar(`Proyecto "${p.nombre}" creado (N° ${p.id}).`, false);
        this.recargarProyectos();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo crear el proyecto.'), true)
    });
  }

  asignarPieza() {
    const { proyectoId, piezaId, cantidad } = this.asignacion;
    if (proyectoId == null || piezaId == null || Number(cantidad) < 1) {
      this.mostrar('Selecciona proyecto, pieza y una cantidad válida.', true);
      return;
    }
    this.service.asignarPieza(proyectoId, piezaId, Number(cantidad)).subscribe({
      next: () => {
        this.mostrar('Pieza asignada al proyecto. Stock actualizado.', false);
        this.recargarPiezas();
        this.recargarProyectos();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo asignar la pieza.'), true)
    });
  }

  get proyectosAbiertos(): Proyecto[] {
    return this.proyectos.filter(p => p.estado === 'Registrado' || p.estado === 'En proceso');
  }

  opcionesEstado(p: Proyecto): string[] {
    return this.transiciones[p.estado] ?? [];
  }

  cambiarEstado(p: Proyecto) {
    const estado = this.nuevoEstado[p.id];
    if (!estado) {
      this.mostrar('Elige el nuevo estado del proyecto.', true);
      return;
    }
    if (estado === 'Cancelado' || estado === 'Rechazado') {
      const aviso = p.detalles.length > 0 ? ' Las piezas asignadas volverán al inventario.' : '';
      if (!confirm(`¿Marcar el proyecto "${p.nombre}" como ${estado.toLowerCase()}?${aviso}`)) return;
    }
    this.service.cambiarEstado(p.id, estado).subscribe({
      next: () => {
        this.nuevoEstado[p.id] = '';
        this.mostrar(`Proyecto "${p.nombre}": ahora está ${estado.toLowerCase()}.`, false);
        this.recargarProyectos();
        this.recargarPiezas();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo cambiar el estado.'), true)
    });
  }

  textoVehiculo(id: number): string {
    const v = this.vehiculos.find(x => x.id === id);
    return v ? `${v.marca} ${v.modelo} (${v.placa})` : `Vehículo #${id}`;
  }

  totalProyecto(p: Proyecto): number {
    return p.detalles.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}