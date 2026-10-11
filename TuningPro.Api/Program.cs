using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using TuningPro.Business.Config;
using TuningPro.Business.Services;
using TuningPro.Business.Strategies;
using TuningPro.Data;
using TuningPro.Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("Angular",
    p => p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

// Capa de datos
builder.Services.AddDbContext<TuningProDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("TuningProDb"),
        sql => sql.MigrationsAssembly("TuningPro.Data")));
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));      // Repository
builder.Services.AddScoped<ICompatibilidadRepository, CompatibilidadRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();

// Capa de negocio
builder.Services.AddScoped<ICompatibilidadStrategy, FrenosStrategy>();         // Strategy
builder.Services.AddScoped<ICompatibilidadStrategy, SuspensionStrategy>();
builder.Services.AddScoped<ICompatibilidadStrategy, TurboStrategy>();
builder.Services.AddScoped<ICompatibilidadStrategy, GeneralStrategy>();
builder.Services.AddSingleton<ConfiguracionTaller>();                          // Singleton
builder.Services.AddScoped<ICompatibilidadService, CompatibilidadService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Angular");
app.MapControllers();
app.Run();