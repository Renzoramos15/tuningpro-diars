import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdenesTrabajoService, OrdenTrabajo, subtotalRepuestos, igv, totalGeneral, codigoOt } from '../../ordenes-trabajo.service';
import { AuthService } from '../../auth.service';
import { mensajeError } from '../../errores';

@Component({
  selector: 'app-ot-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ot-detalle.component.html',
  styleUrl: './ot-detalle.component.css'
})
export class OtDetalleComponent implements OnInit {
  orden: OrdenTrabajo | null = null;
  cargando = true;
  mensaje = '';
  esError = false;
  guardandoEstado = false;

  estados: OrdenTrabajo['estado'][] = ['Registrado', 'En proceso', 'Finalizado'];

  codigoOt = codigoOt;
  subtotalRepuestos = subtotalRepuestos;
  igv = igv;
  totalGeneral = totalGeneral;

  constructor(
    private route: ActivatedRoute,
    private service: OrdenesTrabajoService,
    public auth: AuthService
  ) {}

  get puedeCambiarEstado(): boolean {
    return this.auth.puede('Administrador', 'Tecnico');
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: o => { this.orden = o; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.mensaje = mensajeError(e, 'No se pudo cargar la orden de trabajo.');
        this.esError = true;
      }
    });
  }

  cambiarEstado(estado: OrdenTrabajo['estado']): void {
    if (!this.orden || !this.puedeCambiarEstado || estado === this.orden.estado) return;
    this.guardandoEstado = true;
    this.service.cambiarEstado(this.orden.id, estado).subscribe({
      next: o => { this.orden = o; this.guardandoEstado = false; },
      error: e => {
        this.guardandoEstado = false;
        this.mensaje = mensajeError(e, 'No se pudo actualizar el estado.');
        this.esError = true;
      }
    });
  }
}