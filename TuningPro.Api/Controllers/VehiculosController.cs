using Microsoft.AspNetCore.Mvc;
using TuningPro.Data.Entities;
using TuningPro.Data.Repositories;

namespace TuningPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly IRepository<Vehiculo> _repo;
    public VehiculosController(IRepository<Vehiculo> repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _repo.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Post(Vehiculo vehiculo)
    {
        var existentes = await _repo.GetAllAsync();
        if (existentes.Any(v => v.Placa == vehiculo.Placa))
            return Conflict(new { mensaje = "Ya existe un vehículo con esa placa." });

        vehiculo.Id = 0;
        await _repo.AddAsync(vehiculo);
        await _repo.SaveAsync();
        return Created($"api/vehiculos/{vehiculo.Id}", vehiculo);
    }
}