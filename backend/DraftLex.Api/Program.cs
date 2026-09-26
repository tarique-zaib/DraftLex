using DraftLex.Api.Middleware;
using DraftLex.Api.Services;
using DraftLex.Application.Common.AI;
using DraftLex.Application.Common.Security;
using DraftLex.Application.Features.Auth;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using DraftLex.Infrastructure.AI;
using DraftLex.Infrastructure.Persistence;
using DraftLex.Infrastructure.Repositories;
using DraftLex.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
});

// -------------------------
// Services
// -------------------------

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DraftLex.Api",
        Version = "v1"
    });

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter only the JWT token"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference(JwtBearerDefaults.AuthenticationScheme, document)] = []
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Database
builder.Services.AddDbContext<DraftLexDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DraftLexDb")));

builder.Services.AddScoped<IDraftLexDbContext>(sp =>
    sp.GetRequiredService<DraftLexDbContext>());

// Application Services
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<ILegalDocumentRepository, LegalDocumentRepository>();
builder.Services.AddScoped<ClientService>();
builder.Services.AddScoped<LegalDocumentService>();
builder.Services.AddScoped<PdfExportService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.Configure<OllamaSettings>(
    builder.Configuration.GetSection("Ollama"));

builder.Services.AddHttpClient<IAILegalDraftService, OllamaLegalDraftService>();
builder.Services.AddHttpClient<ICopilotService, MatterCopilotService>();

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<RegisterAdvocateCommandHandler>());

// JWT Settings
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt.Key))
        };
    });

builder.Services.AddAuthorization();

// JWT Service
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// -------------------------
// Build
// -------------------------

var app = builder.Build();

app.UseCors("Frontend");

// -------------------------
// Middleware
// -------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] =
        "camera=(), microphone=(), geolocation=()";

    context.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; " +
        "img-src 'self' data: http://localhost:5073; " +
        "style-src 'self' 'unsafe-inline'; " +
        "script-src 'self'; " +
        "font-src 'self' data:; " +
        "connect-src 'self' http://localhost:5173 http://localhost:5073; " +
        "frame-ancestors 'none';";

    await next();
});

app.UseAuthentication();
app.UseAuthorization();

var evidencePath = Path.Combine(
    Directory.GetCurrentDirectory(),
    "uploads");

Directory.CreateDirectory(evidencePath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(evidencePath),
    RequestPath = "/uploads"
});

app.UseMiddleware<ExceptionMiddleware>();

app.MapControllers();

app.Run();