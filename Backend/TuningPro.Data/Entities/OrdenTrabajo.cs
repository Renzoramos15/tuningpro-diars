namespace TuningPro.Data.Entities;

public class OrdenTrabajo
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public DateTime FechaEmision { get; set; } = DateTime.Now;
    public decimal ManoObra { get; set; }
    public decimal TotalPiezas { get; set; }
    public decimal Total { get; set; }
    public string Observaciones { get; set; } = string.Empty;
    public string EmitidaPor { get; set; } = string.Empty;
}