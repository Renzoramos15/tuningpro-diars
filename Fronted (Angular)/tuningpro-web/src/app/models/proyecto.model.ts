export interface ProyectoNuevoInfo {
  numero: number;
  codigo: string;
  fechaIngreso: string;
  recepcionista: string;
}

export interface Cliente { id: number; nombre: string; }
export interface Vehiculo { id: number; placa: string; marca: string; modelo: string; anio: number; }
export interface Problema { id: number; nombre: string; }

export interface Proyecto {
  id: number;
  codigo: string;
  fechaIngreso: string;
  clienteId: number | null;
  cliente: string;
  vehiculoId: number;
  vehiculo: string;
  placa: string;
  recepcionista: string;
  problemas: string[];
  otrosProblema?: string | null;
  notasRecepcion?: string | null;
  estado: string;
  total: number;
}

export interface ProyectoCrear {
  clienteId: number;
  vehiculoId: number;
  problemaIds: number[];
  otrosProblema: string | null;
  notasRecepcion: string | null;
}