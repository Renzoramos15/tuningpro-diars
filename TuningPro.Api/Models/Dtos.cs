namespace TuningPro.Api.Models;

public record MovimientoDto(int Cantidad, bool EsEntrada);
public record CompatibilidadDto(int VehiculoId, int PiezaId);
public record CrearProyectoDto(string Nombre, int VehiculoId);
public record AsignarPiezaDto(int PiezaId, int Cantidad);
public record CambiarEstadoDto(string Estado);