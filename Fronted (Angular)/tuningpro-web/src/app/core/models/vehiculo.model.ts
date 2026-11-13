export interface Vehiculo {
  id: number; placa: string; marca: string; modelo: string; anio: number; clienteNombre: string;
  usuarioId: number | null;
}

export interface ClienteCuenta { id: number; nombreUsuario: string; nombreCompleto: string; }