import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

// Pantalla inicial de cada rol (la misma que usa el menú)
export function rutaInicial(auth: AuthService): string {
  if (auth.puede('Cliente')) return '/portal';
  if (auth.puede('Administrador', 'Tecnico', 'Auxiliar')) return '/inventario';
  return '/proyectos'; // Recepcionista
}

// Deja pasar solo si el rol del usuario está en data.roles de la ruta
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Sin sesión, AppComponent ya muestra el login; no se redirige para evitar bucles
  if (!auth.logueado) return true;

  const roles = (route.data['roles'] as string[] | undefined) ?? [];
  if (roles.length === 0 || auth.puede(...roles)) return true;

  return router.parseUrl(rutaInicial(auth));
};