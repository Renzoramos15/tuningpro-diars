using TuningPro.Data.Entities;
using TuningPro.Data.Repositories;

namespace TuningPro.Business.Services;

public record HistorialPiezaDto(string Codigo, string Pieza, string Categoria, string Marca,
    int Cantidad, decimal PrecioUnitario, decimal Subtotal);

public record HistorialOrdenDto(int Id, DateTime FechaEmision, decimal ManoObra,
    decimal TotalPiezas, decimal Total, string EmitidaPor);

public record HistorialProyectoDto(int Id, string Nombre, string Estado, DateTime FechaRegistro,
    List<HistorialPiezaDto> Piezas, decimal TotalPiezas, HistorialOrdenDto? Orden);

public record HistorialVehiculoDto(int Id, string Placa, string Marca, string Modelo, int Anio,
    string Cliente, int TotalProyectos, int TotalPiezasInstaladas, decimal InversionTotal,
    List<HistorialProyectoDto> Proyectos);

public interface IHistorialService
{
    Task<HistorialVehiculoDto> ObtenerAsync(int vehiculoId);
}

public class HistorialService : IHistorialService
{
    private readonly IRepository<Vehiculo> _vehiculos;
    private readonly IProyectoRepository _proyectos;
    private readonly IOrdenTrabajoRepository _ordenes;
    private readonly IRepository<Pieza> _piezas;

    public HistorialService(IRepository<Vehiculo> vehiculos, IProyectoRepository proyectos,
        IOrdenTrabajoRepository ordenes, IRepository<Pieza> piezas)
    {
        _vehiculos = vehiculos; _proyectos = proyectos; _ordenes = ordenes; _piezas = piezas;
    }

    public async Task<HistorialVehiculoDto> ObtenerAsync(int vehiculoId)
    {
        var vehiculo = await _vehiculos.GetByIdAsync(vehiculoId)
                       ?? throw new KeyNotFoundException("Vehículo no encontrado.");

        // Proyectos del vehículo, del más reciente al más antiguo
        var proyectos = await _proyectos.GetByVehiculosAsync(new List<int> { vehiculoId });

        var ordenes = proyectos.Count == 0
            ? new List<OrdenTrabajo>()
            : await _ordenes.GetByProyectosAsync(proyectos.Select(p => p.Id).ToList());
        var ordenPorProyecto = ordenes.ToDictionary(o => o.ProyectoId);

        var piezas = (await _piezas.GetAllAsync()).ToDictionary(p => p.Id);

        var proyectosDto = proyectos.Select(p =>
        {
            var detalle = p.Detalles.Select(d =>
            {
                piezas.TryGetValue(d.PiezaId, out var pieza);
                return new HistorialPiezaDto(
                    pieza?.Codigo ?? string.Empty,
                    pieza?.Nombre ?? $"Pieza #{d.PiezaId}",
                    pieza?.Categoria ?? string.Empty,
                    pieza?.Marca ?? string.Empty,
                    d.Cantidad, d.PrecioUnitario, d.Cantidad * d.PrecioUnitario);
            }).ToList();

            var totalPiezas = detalle.Sum(x => x.Subtotal);

            HistorialOrdenDto? orden = null;
            if (ordenPorProyecto.TryGetValue(p.Id, out var o))
                orden = new HistorialOrdenDto(o.Id, o.FechaEmision, o.ManoObra, o.TotalPiezas, o.Total, o.EmitidaPor);

            return new HistorialProyectoDto(p.Id, p.Nombre, p.Estado, p.FechaRegistro, detalle, totalPiezas, orden);
        }).ToList();

        // Inversión: total de la orden si ya se emitió; si no, el costo de las piezas instaladas
        var inversion = proyectosDto.Sum(p => p.Orden?.Total ?? p.TotalPiezas);
        var piezasInstaladas = proyectosDto.Sum(p => p.Piezas.Sum(x => x.Cantidad));

        return new HistorialVehiculoDto(vehiculo.Id, vehiculo.Placa, vehiculo.Marca, vehiculo.Modelo,
            vehiculo.Anio, vehiculo.ClienteNombre, proyectosDto.Count, piezasInstaladas, inversion, proyectosDto);
    }
}