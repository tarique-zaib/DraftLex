using DraftLex.Api.Middleware;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using DraftLex.Infrastructure.Persistence;
using DraftLex.Infrastructure.Repositories;
using MediatR;
using DraftLex.Application;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// -------------------------
// Services
// -------------------------

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<DraftLexDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DraftLexDb")));

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(DraftLex.Application.Services.ClientService).Assembly));

builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<ClientService>();
builder.Services.AddScoped<IDraftLexDbContext>(provider =>
    provider.GetRequiredService<DraftLexDbContext>());

// -------------------------
// Build
// -------------------------

var app = builder.Build();

// -------------------------
// Middleware
// -------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseMiddleware<ExceptionMiddleware>();

app.MapControllers();

app.Run();