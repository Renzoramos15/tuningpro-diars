import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  OrdenesTrabajoService, DatosNuevaOrden, PiezaCompatible, RepuestoSeleccionado
} from '../ordenes-trabajo.service';
import { subtotalRepuestos, igv, totalGeneral } from '../ordenes-trabajo.service';

interface LineaRepuesto extends RepuestoSeleccionado {
  codigo: string; nombre: string; precioUnitario: number; stockDisponible: number;
}

@Component({
  selector: 'app-ot-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ot-nueva.component.html',
  styleUrl: './ot-nueva.component.css'
})
export class OtNuevaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OrdenesTrabajoService);

  cargando = true;
  guardando = false;
  error = '';

  datos: DatosNuevaOrden | null = null;
  proyectoId = 0;

  tecnicoId: number | null = null;
  manoObra = 0;
  observaciones = '';

  busquedaRepuesto = '';
  lineas: LineaRepuesto[] = [];

  ngOnInit(): void {
    this.proyectoId = Number(this.route.snapshot.paramMap.get('proyectoId'));
    this.service.obtenerDatosNueva(this.proyectoId).subscribe({
      next: (datos) => { this.datos = datos; this.cargando = false; },
      error: (err) => {
        this.error = err?.error?.mensaje ?? err?.error ?? 'No se pudo cargar la información del proyecto.';
        this.cargando = false;
      }
    });
  }

  get repuestosFiltrados(): PiezaCompatible[] {
    if (!this.datos) return [];
    const termino = this.busquedaRepuesto.trim().toLowerCase();
    const yaAgregados = new Set(this.lineas.map(l => l.piezaId));
    return this.datos.repuestosCompatibles
      .filter(p => !yaAgregados.has(p.id))
      .filter(p => !termino || p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino));
  }

  agregarRepuesto(pieza: PiezaCompatible): void {
    this.lineas.push({
      piezaId: pieza.id, cantidad: 1,
      codigo: pieza.codigo, nombre: pieza.nombre,
      precioUnitario: pieza.precioUnitario, stockDisponible: pieza.stock
    });
    this.busquedaRepuesto = '';
  }

  quitarRepuesto(piezaId: number): void {
    this.lineas = this.lineas.filter(l => l.piezaId !== piezaId);
  }

  ajustarCantidad(linea: LineaRepuesto, valor: number): void {
    const cantidad = Math.max(1, Math.min(valor, linea.stockDisponible));
    linea.cantidad = cantidad;
  }

  get subtotal(): number { return subtotalRepuestos(this.lineas); }
  get montoIgv(): number { return igv(this.subtotal); }
  get total(): number { return totalGeneral(this.subtotal, this.manoObra || 0); }

  get puedeGuardar(): boolean {
    return !!this.tecnicoId && this.lineas.length > 0 && !this.guardando;
  }

  guardar(): void {
    if (!this.puedeGuardar || !this.tecnicoId) return;
    this.guardando = true;
    this.error = '';

    this.service.crear({
      proyectoId: this.proyectoId,
      tecnicoId: this.tecnicoId,
      manoObra: this.manoObra || 0,
      observaciones: this.observaciones,
      repuestos: this.lineas.map(l => ({ piezaId: l.piezaId, cantidad: l.cantidad }))
    }).subscribe({
      next: (orden) => this.router.navigate(['/ordenes-trabajo', orden.id]),
      error: (err) => {
        this.error = err?.error?.mensaje ?? err?.error ?? 'No se pudo registrar la orden de trabajo.';
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/proyectos']);
  }
}