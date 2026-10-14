using Microsoft.EntityFrameworkCore;
using TuningPro.Data.Entities;

namespace TuningPro.Data;

public class TuningProDbContext : DbContext
{
    public TuningProDbContext(DbContextOptions<TuningProDbContext> options) : base(options) { }

    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Pieza> Piezas => Set<Pieza>();
    public DbSet<Compatibilidad> Compatibilidades => Set<Compatibilidad>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<DetalleProyecto> DetallesProyecto => Set<DetalleProyecto>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Vehiculo>().HasIndex(v => v.Placa).IsUnique();
        mb.Entity<Pieza>().Property(p => p.PrecioUnitario).HasPrecision(18, 2);
        mb.Entity<DetalleProyecto>().Property(d => d.PrecioUnitario).HasPrecision(18, 2);

        mb.Entity<Pieza>().HasOne<Proveedor>().WithMany().HasForeignKey(p => p.ProveedorId);
        mb.Entity<Compatibilidad>().HasOne<Vehiculo>().WithMany().HasForeignKey(c => c.VehiculoId);
        mb.Entity<Compatibilidad>().HasOne<Pieza>().WithMany().HasForeignKey(c => c.PiezaId);
        mb.Entity<Compatibilidad>().HasIndex(c => new { c.VehiculoId, c.PiezaId }).IsUnique();
        mb.Entity<Proyecto>().HasOne<Vehiculo>().WithMany().HasForeignKey(p => p.VehiculoId);
        mb.Entity<DetalleProyecto>().HasOne<Pieza>().WithMany().HasForeignKey(d => d.PiezaId);
        mb.Entity<Usuario>().HasIndex(u => u.NombreUsuario).IsUnique();

        // Datos de ejemplo para la demo
        mb.Entity<Proveedor>().HasData(
            new Proveedor { Id = 1, Nombre = "Brembo", Contacto = "ventas@brembo.com" },
            new Proveedor { Id = 2, Nombre = "Bilstein", Contacto = "ventas@bilstein.com" },
            new Proveedor { Id = 3, Nombre = "HKS", Contacto = "ventas@hks.com" });

        mb.Entity<Vehiculo>().HasData(
            new Vehiculo { Id = 1, Placa = "ABC-123", Marca = "Toyota", Modelo = "Supra", Anio = 1998, ClienteNombre = "Juan Pérez" },
            new Vehiculo { Id = 2, Placa = "XYZ-789", Marca = "Honda", Modelo = "Civic", Anio = 1993, ClienteNombre = "María Torres" });

        mb.Entity<Pieza>().HasData(
            new Pieza { Id = 1, Codigo = "BRM-001", Nombre = "Discos de freno Brembo", Marca = "Brembo", Categoria = "Frenos", Stock = 8, PrecioUnitario = 1200m, ProveedorId = 1 },
            new Pieza { Id = 2, Codigo = "BIL-001", Nombre = "Amortiguadores Bilstein B8", Marca = "Bilstein", Categoria = "Suspensión", Stock = 4, PrecioUnitario = 2100m, ProveedorId = 2 },
            new Pieza { Id = 3, Codigo = "HKS-001", Nombre = "Turbo HKS GT", Marca = "HKS", Categoria = "Turbo", Stock = 1, PrecioUnitario = 5400m, ProveedorId = 3 });

        mb.Entity<Compatibilidad>().HasData(
            new Compatibilidad { Id = 1, VehiculoId = 1, PiezaId = 1 },
            new Compatibilidad { Id = 2, VehiculoId = 1, PiezaId = 2 },
            new Compatibilidad { Id = 3, VehiculoId = 1, PiezaId = 3 },
            new Compatibilidad { Id = 4, VehiculoId = 2, PiezaId = 1 },
            new Compatibilidad { Id = 5, VehiculoId = 2, PiezaId = 3 });
    }
}