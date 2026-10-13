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
}

public class ProyectoRepository : Repository<Proyecto>, IProyectoRepository
{
    public ProyectoRepository(TuningProDbContext context) : base(context) { }

    public Task<Proyecto?> GetConDetallesAsync(int id) =>
        _context.Proyectos.Include(p => p.Detalles).FirstOrDefaultAsync(p => p.Id == id);

    public Task<List<Proyecto>> GetAllConDetallesAsync() =>
        _context.Proyectos.Include(p => p.Detalles).OrderByDescending(p => p.Id).ToListAsync();
}