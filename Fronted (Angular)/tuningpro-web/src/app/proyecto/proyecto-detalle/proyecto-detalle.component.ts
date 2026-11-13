import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProyectoService } from '../proyecto.service';
import { AuthService } from '../../auth.service';
import { Proyecto } from '../../models/proyecto.model';

@Component({
  selector: 'app-proyecto-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './proyecto-detalle.component.html',
  styleUrl: './proyecto-detalle.component.css'
})
export class ProyectoDetalleComponent implements OnInit {
  private api = inject(ProyectoService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  proyecto = signal<Proyecto | null>(null);
  cargando = signal(true);
  error = signal('');

  // TODO: ponlo en true cuando el proyecto ya tenga orden (ver nota abajo)
  tieneOrden = signal(false);

  puedeGestionarOT = computed(() => this.auth.puede('Administrador', 'Tecnico'));

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.obtener(id).subscribe({
      next: p => { this.proyecto.set(p); this.cargando.set(false); },
      error: e => {
        this.cargando.set(false);
        this.error.set(e.status === 404 ? 'El proyecto no existe.' : 'No se pudo cargar el proyecto.');
      }
    });
  }
}