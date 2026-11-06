using TuningPro.Data.Entities;
using TuningPro.Data.Repositories;

namespace TuningPro.Business.Services;

public record OrdenDetalleDto(string Pieza, int Cantidad, decimal PrecioUnitario, decimal Subtotal);

public record OrdenTrabajoDto(
    int Id, int ProyectoId, string Proyecto, string Vehiculo, string Cliente,
    DateTime FechaEmision, List<OrdenDetalleDto> Piezas,
    decimal ManoObra, decimal TotalPiezas, decimal Total,
    string Observaciones, string EmitidaPor);

public interface IOrdenTrabajoService
{
    Task<OrdenTrabajoDto> GenerarAsync(int proyectoId, decimal manoObra, string? observaciones, string emitidaPor);
    Task<List<OrdenTrabajoDto>> ListarAsync();
}

public class OrdenTrabajoService : IOrdenTrabajoService
{
    private readonly IOrdenTrabajoRepository _ordenes;
    private readonly IProyectoRepository _proyectos;
    private readonly IRepository<Vehiculo> _vehiculos;
    private readonly IRepository<Pieza> _piezas;

    public OrdenTrabajoService(IOrdenTrabajoRepository ordenes, IProyectoRepository proyectos,
        IRepository<Vehiculo> vehiculos, IRepository<Pieza> piezas)
    {
        _ordenes = ordenes; _proyectos = proyectos; _vehiculos = vehiculos; _piezas = piezas;
    }

    public async Task<OrdenTrabajoDto> GenerarAsync(int proyectoId, decimal manoObra, string? observaciones, string emitidaPor)
    {
        if (manoObra < 0)
            throw new InvalidOperationException("La mano de obra no puede ser negativa.");

        var proyecto = await _proyectos.GetConDetallesAsync(proyectoId)
                       ?? throw new KeyNotFoundException("Proyecto no encontrado.");

        if (await _ordenes.ExisteParaProyectoAsync(proyectoId))
            throw new InvalidOperationException("El proyecto ya tiene una orden de trabajo.");

        if (proyecto.Detalles.Count == 0)
            throw new InvalidOperationException("El proyecto no tiene piezas asignadas.");

        // Cálculo del costo (RF11): piezas + mano de obra
        var totalPiezas = proyecto.Detalles.Sum(d => d.Cantidad * d.PrecioUnitario);

        var orden = new OrdenTrabajo
        {
            ProyectoId = proyectoId,
            FechaEmision = DateTime.Now,
            ManoObra = manoObra,
            TotalPiezas = totalPiezas,
            Total = totalPiezas + manoObra,
            Observaciones = (observaciones ?? string.Empty).Trim(),
            EmitidaPor = emitidaPor
        };

        await _ordenes.AddAsync(orden);
        await _ordenes.SaveAsync();

        var vehiculo = await _vehiculos.GetByIdAsync(proyecto.VehiculoId);
        var piezas = (await _piezas.GetAllAsync()).ToDictionary(p => p.Id);
        return Armar(orden, proyecto, vehiculo, piezas);
    }

    public async Task<List<OrdenTrabajoDto>> ListarAsync()
    {
        var ordenes = await _ordenes.GetTodasAsync();
        if (ordenes.Count == 0) return new List<OrdenTrabajoDto>();

        var proyectos = (await _proyectos.GetAllConDetallesAsync()).ToDictionary(p => p.Id);
        var vehiculos = (await _vehiculos.GetAllAsync()).ToDictionary(v => v.Id);
        var piezas = (await _piezas.GetAllAsync()).ToDictionary(p => p.Id);

        return ordenes
            .Where(o => proyectos.ContainsKey(o.ProyectoId))
            .Select(o =>
            {
                var proyecto = proyectos[o.ProyectoId];
                vehiculos.TryGetValue(proyecto.VehiculoId, out var vehiculo);
                return Armar(o, proyecto, vehiculo, piezas);
            })
            .ToList();
    }

    private static OrdenTrabajoDto Armar(OrdenTrabajo o, Proyecto proyecto, Vehiculo? vehiculo,
        Dictionary<int, Pieza> piezas)
    {
        var detalle = proyecto.Detalles.Select(d =>
        {
            piezas.TryGetValue(d.PiezaId, out var pieza);
            return new OrdenDetalleDto(pieza?.Nombre ?? $"Pieza #{d.PiezaId}",
                d.Cantidad, d.PrecioUnitario, d.Cantidad * d.PrecioUnitario);
        }).ToList();

        var textoVehiculo = vehiculo is null ? $"Vehículo #{proyecto.VehiculoId}"
            : $"{vehiculo.Marca} {vehiculo.Modelo} ({vehiculo.Placa})";

        return new OrdenTrabajoDto(o.Id, o.ProyectoId, proyecto.Nombre, textoVehiculo,
            vehiculo?.ClienteNombre ?? "", o.FechaEmision, detalle,
            o.ManoObra, o.TotalPiezas, o.Total, o.Observaciones, o.EmitidaPor);
    }
}