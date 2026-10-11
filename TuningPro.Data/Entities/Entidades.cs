namespace TuningPro.Data.Entities;

public class Vehiculo
{
    public int Id { get; set; }
    public string Placa { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int Anio { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
}

public class Proveedor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Contacto { get; set; } = string.Empty;
}

public class Pieza
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty; // Frenos, Suspensión, Turbo
    public int Stock { get; set; }
    public decimal PrecioUnitario { get; set; }
    public int ProveedorId { get; set; }
}

public class Compatibilidad
{
    public int Id { get; set; }
    public int VehiculoId { get; set; }
    public int PiezaId { get; set; }
}

public class Proyecto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int VehiculoId { get; set; }
    public string Estado { get; set; } = "Registrado";
    public DateTime FechaRegistro { get; set; } = DateTime.Now;
    public List<DetalleProyecto> Detalles { get; set; } = new();
}

public class DetalleProyecto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public int PiezaId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}