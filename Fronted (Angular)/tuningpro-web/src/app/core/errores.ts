export function mensajeError(err: any, porDefecto: string): string {
  if (err?.status === 0) return 'No se pudo conectar con la API. ¿Está corriendo?';
  if (err?.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (err?.status === 403) return 'Tu rol no tiene permiso para realizar esta acción.';
  return err?.error?.mensaje ?? porDefecto;
}