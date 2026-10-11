import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pieza, PiezasService } from './piezas.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  piezas: Pieza[] = [];
  resultado = '';
  vehiculoId = 1; // 1 = Toyota Supra, 2 = Honda Civic

  constructor(private service: PiezasService) {}

  ngOnInit() {
    this.service.getPiezas().subscribe({
      next: p => (this.piezas = p),
      error: () => (this.resultado = '❌ No se pudo conectar con la API')
    });
  }

  validar(piezaId: number) {
    this.service.validar(Number(this.vehiculoId), piezaId).subscribe({
      next: r => (this.resultado = (r.esCompatible ? '✅ ' : '❌ ') + r.mensaje),
      error: () => (this.resultado = '❌ Error al validar')
    });
  }
}