import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProyectoService } from '../proyecto.service';
import { Cliente, Problema, ProyectoNuevoInfo, Vehiculo } from '../../models/proyecto.model';

@Component({
  selector: 'app-proyecto-nuevo',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './proyecto-nuevo.component.html',
  styleUrl: './proyecto-nuevo.component.css'
})
export class ProyectoNuevoComponent implements OnInit {
  private api = inject(ProyectoService);
  private router = inject(Router);

  info = signal<ProyectoNuevoInfo | null>(null);
  clientes = signal<Cliente[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  problemas = signal<Problema[]>([]);

  clienteId = signal<number | null>(null);
  vehiculoId = signal<number | null>(null);
  problemasSel = signal<number[]>([]);
  otros = signal('');
  notas = signal('');

  guardando = signal(false);
  error = signal('');

  clienteSel = computed(() => this.clientes().find(c => c.id === this.clienteId()) ?? null);
  vehiculoSel = computed(() => this.vehiculos().find(v => v.id === this.vehiculoId()) ?? null);
  totalProblemas = computed(() => this.problemasSel().length + (this.otros().trim() ? 1 : 0));
  valido = computed(() => !!this.clienteId() && !!this.vehiculoId() && this.totalProblemas() > 0);

  ngOnInit(): void {
    this.api.info().subscribe({
      next: i => this.info.set(i),
      error: () => this.error.set('No se pudo cargar los datos de recepción.')
    });
    this.api.clientes().subscribe({
      next: c => this.clientes.set(c),
      error: () => this.error.set('No se pudo cargar la lista de clientes.')
    });
    this.api.problemas().subscribe({
      next: p => this.problemas.set(p),
      error: () => this.error.set('No se pudo cargar el catálogo de problemas.')
    });
  }

  onClienteChange(id: number | null): void {
    this.clienteId.set(id);
    this.vehiculoId.set(null);
    this.vehiculos.set([]);
    if (id) {
      this.api.vehiculos(id).subscribe({
        next: v => this.vehiculos.set(v),
        error: () => this.error.set('No se pudo cargar los vehículos del cliente.')
      });
    }
  }

  toggleProblema(id: number, marcado: boolean): void {
    this.problemasSel.update(lista =>
      marcado ? [...lista, id] : lista.filter(x => x !== id));
  }

  guardar(): void {
    if (!this.valido() || this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');

    this.api.crear({
      clienteId: this.clienteId()!,
      vehiculoId: this.vehiculoId()!,
      problemaIds: this.problemasSel(),
      otrosProblema: this.otros().trim() || null,
      notasRecepcion: this.notas().trim() || null
    }).subscribe({
      next: () => this.router.navigate(['/proyectos']),
      error: e => {
        this.error.set(
          e.status === 403
            ? 'Tu rol no tiene permiso para crear proyectos.'
            : e.error?.mensaje ?? 'No se pudo guardar el proyecto.');
        this.guardando.set(false);
      }
    });
  }
}