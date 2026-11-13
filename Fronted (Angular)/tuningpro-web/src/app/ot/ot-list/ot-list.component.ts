import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdenesTrabajoService, OrdenTrabajo, totalGeneral, codigoOt } from '../../ordenes-trabajo.service';
import { mensajeError } from '../../errores';

type Filtro = 'Todos' | 'Registrado' | 'En proceso' | 'Finalizado';

@Component({
  selector: 'app-ot-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ot-list.component.html',
  styleUrl: './ot-list.component.css'
})
export class OtListComponent implements OnInit {
  ordenes: OrdenTrabajo[] = [];
  cargando = true;
  mensaje = '';
  esError = false;

  filtro: Filtro = 'Todos';
  busqueda = '';

  codigoOt = codigoOt;
  totalGeneral = totalGeneral;

  constructor(private service: OrdenesTrabajoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.getAll().subscribe({
      next: o => { this.ordenes = o; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.mensaje = mensajeError(e, 'No se pudieron cargar las órdenes de trabajo.');
        this.esError = true;
      }
    });
  }

  contador(estado: Filtro): number {
    if (estado === 'Todos') return this.ordenes.length;
    return this.ordenes.filter(o => o.estado === estado).length;
  }

  get ordenesFiltradas(): OrdenTrabajo[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.ordenes.filter(o => {
      const coincideEstado = this.filtro === 'Todos' || o.estado === this.filtro;
      if (!coincideEstado) return false;
      if (!texto) return true;
      return (
        this.codigoOt(o.id).toLowerCase().includes(texto) ||
        o.proyectoCodigo.toLowerCase().includes(texto) ||
        o.clienteNombre.toLowerCase().includes(texto) ||
        o.vehiculoPlaca.toLowerCase().includes(texto)
      );
    });
  }
}