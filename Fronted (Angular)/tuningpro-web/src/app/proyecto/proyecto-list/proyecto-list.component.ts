import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PiezasService } from '../../piezas.service';
import { Proyecto } from '../../models/proyecto.model';
import { AuthService } from '../../auth.service';
import { mensajeError } from '../../errores';

@Component({
  selector: 'app-proyecto-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './proyecto-list.component.html',
  styleUrl: './proyecto-list.component.css'
})
export class ProyectoListComponent implements OnInit {
  proyectos: Proyecto[] = [];

  cargando = true;
  mensaje = '';
  esError = false;

  constructor(private service: PiezasService, public auth: AuthService) {}

  get puedeCrear(): boolean {
    return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista');
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.getProyectos().subscribe({
      next: p => { this.proyectos = p as unknown as Proyecto[]; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.mostrar(mensajeError(e, 'No se pudieron cargar los proyectos.'), true);
      }
    });
  }

  private mostrar(texto: string, esError: boolean): void {
    this.mensaje = texto;
    this.esError = esError;
  }
}