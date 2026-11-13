export interface OrdenDetalle { 
    pieza: string; cantidad: number; 
    precioUnitario: number; 
    subtotal: number; }

export interface Orden {
  id: number; 
  proyectoId: number; 
  proyecto: string; 
  vehiculo: string; 
  cliente: string;
  fechaEmision: string; 
  piezas: OrdenDetalle[]; 
  manoObra: number; 
  totalPiezas: number;
  total: number; 
  observaciones: string; 
  emitidaPor: string;
}