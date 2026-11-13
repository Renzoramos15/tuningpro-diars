export interface HistorialPieza {
  codigo: string; 
  pieza: string; 
  categoria: string; 
  marca: string;
  cantidad: number; 
  precioUnitario: number; 
  subtotal: number;
}
export interface HistorialOrden {
  id: number; 
  fechaEmision: string; 
  manoObra: number; 
  totalPiezas: number; 
  total: number; 
  emitidaPor: string;
}
export interface HistorialProyecto {
  id: number; 
  nombre: string; 
  estado: string; 
  fechaRegistro: string;
  piezas: HistorialPieza[]; 
  totalPiezas: number; 
  orden: HistorialOrden | null;
}
export interface Historial {
  id: number; 
  placa: string; 
  marca: string; 
  modelo: string; 
  anio: number; 
  cliente: string;
  totalProyectos: number; 
  totalPiezasInstaladas: number; 
  inversionTotal: number;
  proyectos: HistorialProyecto[];
}