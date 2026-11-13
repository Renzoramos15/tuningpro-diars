import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aviso',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="mensaje" class="aviso" [class.error]="esError" [class.ok]="!esError">
      {{ esError ? '❌' : '✅' }} {{ mensaje }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .aviso {
      padding: 12px 16px; border-radius: 10px; margin: 16px 0; font-weight: 600; font-size: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .aviso.ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .aviso.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  `]
})
export class AvisoComponent {
  @Input() mensaje = '';
  @Input() esError = false;
}