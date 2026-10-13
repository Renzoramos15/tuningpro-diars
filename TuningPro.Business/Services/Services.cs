using TuningPro.Business.Config;
using TuningPro.Business.Strategies;
using TuningPro.Data.Entities;
using TuningPro.Data.Repositories;

namespace TuningPro.Business.Services;

// ---------- Compatibilidad ----------
public interface ICompatibilidadService
{
    Task<ResultadoValidacion> ValidarAsync(int vehiculoId, int piezaId);
    Task RegistrarAsync(int vehiculoId, int piezaId);
}

public class CompatibilidadService : ICompatibilidadService
{
    private readonly IEnumerable<ICompatibilidadStrategy> _strategies;
    private readonly IRepository<Vehiculo> _vehiculos;
    private readonly IRepository<Pieza> _piezas;
    private readonly ICompatibilidadRepository _compat;

    public CompatibilidadService(IEnumerable<ICompatibilidadStrategy> strategies,
        IRepository<Vehiculo> vehiculos, IRepository<Pieza> piezas, ICompatibilidadRepository compat)
    {
        _strategies = strategies; _vehiculos = vehiculos; _piezas = piezas; _compat = compat;
    }

    public async Task<ResultadoValidacion> ValidarAsync(int vehiculoId, int piezaId)
    {
        var v = await _vehiculos.GetByIdAsync(vehiculoId) ?? throw new KeyNotFoundException("Vehículo no encontrado.");
        var p = await _piezas.GetByIdAsync(piezaId) ?? throw new KeyNotFoundException("Pieza no encontrada.");

        var strategy = _strategies.FirstOrDefault(s => s.Categoria == p.Categoria)
                       ?? _strategies.First(s => s.Categoria == "General");
        return await strategy.ValidarAsync(v, p);
    }

    public async Task RegistrarAsync(int vehiculoId, int piezaId)
    {
        if (await _compat.ExisteAsync(vehiculoId, piezaId))
            throw new InvalidOperationException("La compatibilidad ya está registrada.");
        await _compat.AddAsync(new Compatibilidad { VehiculoId = vehiculoId, PiezaId = piezaId });
        await _compat.SaveAsync();
    }
}

// ---------- Inventario ----------
public interface IInventarioService
{
    Task<Pieza> RegistrarMovimientoAsync(int piezaId, int cantidad, bool esEntrada);
    Task<List<Pieza>> ObtenerAlertasAsync();
}

public class InventarioService : IInventarioService
{
    private readonly IRepository<Pieza> _piezas;
    private readonly ConfiguracionTaller _config;

    public InventarioService(IRepository<Pieza> piezas, ConfiguracionTaller config)
    {
        _piezas = piezas; _config = config;
    }

    public async Task<Pieza> RegistrarMovimientoAsync(int piezaId, int cantidad, bool esEntrada)
    {
        var pieza = await _piezas.GetByIdAsync(piezaId) ?? throw new KeyNotFoundException("Pieza no encontrada.");
        if (cantidad <= 0) throw new InvalidOperationException("La cantidad debe ser mayor a 0.");
        if (!esEntrada && pieza.Stock < cantidad) throw new InvalidOperationException("Stock insuficiente.");

        pieza.Stock += esEntrada ? cantidad : -cantidad;
        _piezas.Update(pieza);
        await _piezas.SaveAsync();
        return pieza;
    }

    public async Task<List<Pieza>> ObtenerAlertasAsync() =>
        (await _piezas.GetAllAsync()).Where(p => p.Stock <= _config.StockMinimo).ToList();
}

// ---------- Proyectos ----------
public interface IProyectoService
{
    Task<Proyecto> CrearAsync(string nombre, int vehiculoId);
    Task<Proyecto> AsignarPiezaAsync(int proyectoId, int piezaId, int cantidad);
    Task<Proyecto?> ObtenerAsync(int id);
    Task<List<Proyecto>> ListarAsync();
    Task<Proyecto> CambiarEstadoAsync(int id, string estado);
}

public class ProyectoService : IProyectoService
{
    private static readonly string[] EstadosValidos = { "Registrado", "En proceso", "Finalizado" };

    private readonly IProyectoRepository _proyectos;
    private readonly IRepository<Pieza> _piezas;
    private readonly ICompatibilidadService _compat;
    private readonly IInventarioService _inventario;

    public ProyectoService(IProyectoRepository proyectos, IRepository<Pieza> piezas,
        ICompatibilidadService compat, IInventarioService inventario)
    {
        _proyectos = proyectos; _piezas = piezas; _compat = compat; _inventario = inventario;
    }

    public async Task<Proyecto> CrearAsync(string nombre, int vehiculoId)
    {
        var proyecto = new Proyecto { Nombre = nombre, VehiculoId = vehiculoId };
        await _proyectos.AddAsync(proyecto);
        await _proyectos.SaveAsync();
        return proyecto;
    }

    public async Task<Proyecto> AsignarPiezaAsync(int proyectoId, int piezaId, int cantidad)
    {
        var proyecto = await _proyectos.GetConDetallesAsync(proyectoId)
                       ?? throw new KeyNotFoundException("Proyecto no encontrado.");
        var pieza = await _piezas.GetByIdAsync(piezaId)
                    ?? throw new KeyNotFoundException("Pieza no encontrada.");

        if (proyecto.Estado == "Finalizado")
            throw new InvalidOperationException("El proyecto está finalizado, no admite más piezas.");

        // 1) Validar compatibilidad (Strategy)
        var resultado = await _compat.ValidarAsync(proyecto.VehiculoId, piezaId);
        if (!resultado.EsCompatible) throw new InvalidOperationException(resultado.Mensaje);

        // 2) Descontar stock
        await _inventario.RegistrarMovimientoAsync(piezaId, cantidad, esEntrada: false);

        // 3) Registrar en el proyecto (trazabilidad)
        proyecto.Detalles.Add(new DetalleProyecto
        {
            PiezaId = piezaId,
            Cantidad = cantidad,
            PrecioUnitario = pieza.PrecioUnitario
        });
        proyecto.Estado = "En proceso";
        await _proyectos.SaveAsync();
        return proyecto;
    }

    public Task<Proyecto?> ObtenerAsync(int id) => _proyectos.GetConDetallesAsync(id);

    public Task<List<Proyecto>> ListarAsync() => _proyectos.GetAllConDetallesAsync();

    public async Task<Proyecto> CambiarEstadoAsync(int id, string estado)
    {
        if (!EstadosValidos.Contains(estado))
            throw new InvalidOperationException("Estado no válido.");

        var proyecto = await _proyectos.GetConDetallesAsync(id)
                       ?? throw new KeyNotFoundException("Proyecto no encontrado.");
        proyecto.Estado = estado;
        await _proyectos.SaveAsync();
        return proyecto;
    }
}