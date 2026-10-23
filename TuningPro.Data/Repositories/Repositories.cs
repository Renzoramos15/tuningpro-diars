using Microsoft.EntityFrameworkCore;
using TuningPro.Data.Entities;

namespace TuningPro.Data.Repositories;

public interface IRepository<T> where T : class
{
    Task<List<T>> GetAllAsync();
    Task<T?> GetByIdAsync(int id);
    Task AddAsync(T entity);
    void Update(T entity);
    Task SaveAsync();
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly TuningProDbContext _context;
    public Repository(TuningProDbContext context) => _context = context;

    public Task<List<T>> GetAllAsync() => _context.Set<T>().ToListAsync();
    public async Task<T?> GetByIdAsync(int id) => await _context.Set<T>().FindAsync(id);
    public async Task AddAsync(T entity) => await _context.Set<T>().AddAsync(entity);
    public void Update(T entity) => _context.Set<T>().Update(entity);
    public Task SaveAsync() => _context.SaveChangesAsync();
}

public interface ICompatibilidadRepository : IRepository<Compatibilidad>
{
    Task<bool> ExisteAsync(int vehiculoId, int piezaId);
}

public class CompatibilidadRepository : Repository<Compatibilidad>, ICompatibilidadRepository
{
    public CompatibilidadRepository(TuningProDbContext context) : base(context) { }

    public Task<bool> ExisteAsync(int vehiculoId, int piezaId) =>
        _context.Compatibilidades.AnyAsync(c => c.VehiculoId == vehiculoId && c.PiezaId == piezaId);
}

public interface IProyectoRepository : IRepository<Proyecto>
{
    Task<Proyecto?> GetConDetallesAsync(int id);
    Task<List<Proyecto>> GetAllConDetallesAsync();
    Task<List<Proyecto>> GetByVehiculosAsync(List<int> vehiculoIds);
}

public class ProyectoRepository : Repository<Proyecto>, IProyectoRepository
{
    public ProyectoRepository(TuningProDbContext context) : base(context) { }

    public Task<Proyecto?> GetConDetallesAsync(int id) =>
        _context.Proyectos.Include(p => p.Detalles).FirstOrDefaultAsync(p => p.Id == id);

    public Task<List<Proyecto>> GetAllConDetallesAsync() =>
        _context.Proyectos.Include(p => p.Detalles).OrderByDescending(p => p.Id).ToListAsync();

    public Task<List<Proyecto>> GetByVehiculosAsync(List<int> vehiculoIds) =>
        _context.Proyectos.Include(p => p.Detalles)
            .Where(p => vehiculoIds.Contains(p.VehiculoId))
            .OrderByDescending(p => p.Id)
            .ToListAsync();
}

public interface IVehiculoRepository : IRepository<Vehiculo>
{
    Task<List<Vehiculo>> GetByUsuarioAsync(int usuarioId);
}

public class VehiculoRepository : Repository<Vehiculo>, IVehiculoRepository
{
    public VehiculoRepository(TuningProDbContext context) : base(context) { }

    public Task<List<Vehiculo>> GetByUsuarioAsync(int usuarioId) =>
        _context.Vehiculos.Where(v => v.UsuarioId == usuarioId).ToListAsync();
}

public interface IUsuarioRepository : IRepository<Usuario>
{
    Task<Usuario?> GetByNombreUsuarioAsync(string nombreUsuario);
    Task<bool> HayUsuariosAsync();
}

public class UsuarioRepository : Repository<Usuario>, IUsuarioRepository
{
    public UsuarioRepository(TuningProDbContext context) : base(context) { }

    public Task<Usuario?> GetByNombreUsuarioAsync(string nombreUsuario) =>
        _context.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario);

    public Task<bool> HayUsuariosAsync() => _context.Usuarios.AnyAsync();
}