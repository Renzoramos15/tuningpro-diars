namespace TuningPro.Data.Entities;

public class Proyecto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int VehiculoId { get; set; }
    public string Estado { get; set; } = "Registrado";
    public DateTime FechaRegistro { get; set; } = DateTime.Now;
    public List<DetalleProyecto> Detalles { get; set; } = new();
}
