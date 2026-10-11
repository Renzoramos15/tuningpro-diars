using Microsoft.AspNetCore.Mvc;
using TuningPro.Api.Models;
using TuningPro.Business.Services;

namespace TuningPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProyectosController : ControllerBase
{
    private readonly IProyectoService _service;
    public ProyectosController(IProyectoService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Crear(CrearProyectoDto dto) =>
        Ok(await _service.CrearAsync(dto.Nombre, dto.VehiculoId));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await _service.ObtenerAsync(id);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost("{id}/piezas")]
    public async Task<IActionResult> AsignarPieza(int id, AsignarPiezaDto dto)
    {
        try { return Ok(await _service.AsignarPiezaAsync(id, dto.PiezaId, dto.Cantidad)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensaje = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensaje = ex.Message }); }
    }
}