using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuningPro.Api.Models;
using TuningPro.Business.Config;
using TuningPro.Business.Services;
using TuningPro.Data.Entities;
using TuningPro.Data.Repositories;

namespace TuningPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = RolesTaller.Personal)]
public class PiezasController : ControllerBase
{
    private readonly IRepository<Pieza> _repo;
    private readonly IInventarioService _inventario;

    public PiezasController(IRepository<Pieza> repo, IInventarioService inventario)
    {
        _repo = repo; _inventario = inventario;
    }

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _repo.GetAllAsync());

    [HttpPost]
    [Authorize(Roles = RolesTaller.AdminAuxiliar)]
    public async Task<IActionResult> Post(Pieza pieza)
    {
        pieza.Id = 0;
        await _repo.AddAsync(pieza);
        await _repo.SaveAsync();
        return Created($"api/piezas/{pieza.Id}", pieza);
    }

    [HttpPost("{id}/movimiento")]
    [Authorize(Roles = RolesTaller.AdminAuxiliar)]
    public async Task<IActionResult> Movimiento(int id, MovimientoDto dto)
    {
        try { return Ok(await _inventario.RegistrarMovimientoAsync(id, dto.Cantidad, dto.EsEntrada)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensaje = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensaje = ex.Message }); }
    }

    [HttpGet("alertas")]
    public async Task<IActionResult> Alertas() => Ok(await _inventario.ObtenerAlertasAsync());
}