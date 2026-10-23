import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-icon"></div>
          <h1>TuningPro</h1>
          <p class="sub">Inicia sesión para continuar</p>
        </div>

        <div class="form-group">
          <label for="usuario">Usuario</label>
          <div class="input-wrapper">
            <span class="icon">👤</span>
            <input 
              id="usuario"
              type="text" 
              [(ngModel)]="usuario" 
              (keyup.enter)="entrar()" 
              autocomplete="username" 
              placeholder="Ingresa tu usuario"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <span class="icon">🔒</span>
            <input 
              id="password"
              type="password" 
              [(ngModel)]="password" 
              (keyup.enter)="entrar()" 
              autocomplete="current-password" 
              placeholder="••••••••"
            />
          </div>
        </div>

        <button class="btn-ingresar" (click)="entrar()" [disabled]="cargando">
          <span *ngIf="!cargando">Ingresar</span>
          <span *ngIf="cargando" class="spinner"></span>
          <span *ngIf="cargando">Ingresando...</span>
        </button>

        <div class="error-message" *ngIf="error">
          <span>⚠️</span> {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow-y: auto;
    }

    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }

    .login-card {
      background: #ffffff;
      width: 100%;
      max-width: 400px;
      padding: 40px 32px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 4px;
    }

    .logo-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #1e3a8a;
      letter-spacing: -0.5px;
    }

    .sub {
      margin: 6px 0 0 0;
      font-size: 14px;
      color: #64748b;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper .icon {
      position: absolute;
      left: 12px;
      font-size: 16px;
      pointer-events: none;
    }

    input {
      width: 100%;
      padding: 12px 14px 12px 38px;
      font-size: 14px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      transition: all 0.2s ease;
      background-color: #f8fafc;
      color: #0f172a;
      box-sizing: border-box;
    }

    input:focus {
      border-color: #2563eb;
      background-color: #ffffff;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }

    .btn-ingresar {
      margin-top: 6px;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: white;
      border: none;
      padding: 12px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
    }

    .btn-ingresar:hover:not(:disabled) {
      background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.4);
      transform: translateY(-1px);
    }

    .btn-ingresar:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-ingresar:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: shake 0.3s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `]
})
export class LoginComponent {
  @Output() ingreso = new EventEmitter<void>();
  usuario = '';
  password = '';
  error = '';
  cargando = false;

  constructor(private auth: AuthService) {}

  entrar() {
    if (!this.usuario.trim() || !this.password) {
      this.error = 'Escribe tu usuario y contraseña.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.auth.login(this.usuario.trim(), this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.password = '';
        this.ingreso.emit();
      },
      error: e => {
        this.cargando = false;
        this.error = e?.status === 0
          ? 'No se pudo conectar con la API.'
          : (e?.error?.mensaje ?? 'No se pudo iniciar sesión.');
      }
    });
  }
}