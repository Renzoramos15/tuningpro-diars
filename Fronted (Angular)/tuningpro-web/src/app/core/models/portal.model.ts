export interface PortalVehiculo { id: number; 
    placa: string; 
    marca: string; 
    modelo: string; 
    anio: number; }

export interface PortalDetalle {
  pieza: string; 
  categoria: string; 
  cantidad: number; 
  precioUnitario: number; 
  subtotal: number;
}

export interface PortalOrden {
  fechaEmision: string; 
  manoObra: number; 
  totalPiezas: number; 
  total: number;
}

export interface PortalProyecto {
  id: number; 
  nombre: string; 
  vehiculo: string; 
  estado: string;
  fechaRegistro: string; 
  piezas: PortalDetalle[]; 
  total: number; 
  orden: PortalOrden | null;
}

export interface PortalResumen { 
    cliente: string; 
    vehiculos: PortalVehiculo[]; 
    proyectos: PortalProyecto[]; }