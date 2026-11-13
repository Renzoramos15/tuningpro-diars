export interface DetalleProyecto {
  id: number; 
  proyectoId: number; 
  piezaId: number; 
  piezaNombre: string;
  cantidad: number; 
  precioUnitario: number;
}

export interface Proyecto {
  id: number; 
  nombre: string; 
  vehiculoId: number; 
  estado: string;
  fechaRegistro: string; 
  detalles: DetalleProyecto[];
}