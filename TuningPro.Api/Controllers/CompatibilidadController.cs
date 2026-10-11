using Microsoft.AspNetCore.Mvc;
using TuningPro.Api.Models;
using TuningPro.Business.Services;

namespace TuningPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompatibilidadController : ControllerBase
{
    private readonly ICompatibilidadService _service;
    public CompatibilidadController(ICompatibilidadService service) => _service = service;

    [HttpGet("validar")]
    public async Task<IActionResult> Validar(int vehiculoId, int piezaId)
    {
        try { return Ok(await _service.ValidarAsync(vehiculoId, piezaId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensaje = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Registrar(CompatibilidadDto dto)
    {
        try { await _service.RegistrarAsync(dto.VehiculoId, dto.PiezaId); return Ok(new { mensaje = "Compatibilidad registrada." }); }
        catch (InvalidOperationException ex) { return Conflict(new { mensaje = ex.Message }); }
    }
}