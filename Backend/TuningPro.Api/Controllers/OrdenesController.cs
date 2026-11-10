using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuningPro.Api.Models;
using TuningPro.Business.Config;
using TuningPro.Business.Services;

namespace TuningPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = RolesTaller.AdminRecepcion)]
public class OrdenesController : ControllerBase
{
    private readonly IOrdenTrabajoService _service;
    public OrdenesController(IOrdenTrabajoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.ListarAsync());

    [HttpPost]
    public async Task<IActionResult> Generar(GenerarOrdenDto dto)
    {
        var emitidaPor = User.FindFirst("nombre")?.Value ?? User.Identity?.Name ?? "";
        try { return Ok(await _service.GenerarAsync(dto.ProyectoId, dto.ManoObra, dto.Observaciones, emitidaPor)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensaje = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensaje = ex.Message }); }
    }
}