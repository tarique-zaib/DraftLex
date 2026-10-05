using DraftLex.Api.Middleware;
using DraftLex.Api.Services;
using DraftLex.Application.Common.AI;
using DraftLex.Application.Common.Security;
using DraftLex.Application.Features.Auth;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using DraftLex.Infrastructure.AI;
using DraftLex.Infrastructure.Documents;
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

// ============================================================
// KESTREL
// ============================================================

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
});

// ============================================================
// SERVICES
// ============================================================

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DraftLex.Api",
        Version = "v1"
    });

    options.AddSecurityDefinition(
        JwtBearerDefaults.AuthenticationScheme,
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter only the JWT token"
        });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [
                new OpenApiSecuritySchemeReference(
                    JwtBearerDefaults.AuthenticationScheme,
                    document)
            ] = []
        });
});

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("DraftLexFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://4mf00dhb-5173.inc1.devtunnels.ms",
                "https://draft-lex-ten.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<DraftLexDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DraftLexDb")));

builder.Services.AddScoped<IDraftLexDbContext>(sp =>
    sp.GetRequiredService<DraftLexDbContext>());

// ============================================================
// APPLICATION SERVICES
// ============================================================

builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<ILegalDocumentRepository, LegalDocumentRepository>();

builder.Services.AddScoped<ClientService>();
builder.Services.AddScoped<LegalDocumentService>();
builder.Services.AddScoped<PdfExportService>();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IDocumentTextExtractor, DocumentTextExtractor>();

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// ============================================================
// AI
// ============================================================

builder.Services.Configure<OllamaSettings>(
    builder.Configuration.GetSection("Ollama"));

builder.Services.AddHttpClient<
    IAILegalDraftService,
    OllamaLegalDraftService>();

builder.Services.AddHttpClient<
    ICopilotService,
    MatterCopilotService>();

// ============================================================
// MEDIATR
// ============================================================

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<
        RegisterAdvocateCommandHandler>());

// ============================================================
// JWT SETTINGS
// ============================================================

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

var jwt = builder.Configuration
    .GetSection("Jwt")
    .Get<JwtSettings>();

if (jwt == null)
{
    throw new InvalidOperationException(
        "JWT configuration is missing.");
}

if (string.IsNullOrWhiteSpace(jwt.Key))
{
    throw new InvalidOperationException(
        "Jwt:Key is missing.");
}

// ============================================================
// JWT AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwt.Issuer,
                ValidAudience = jwt.Audience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwt.Key)),

                ClockSkew = TimeSpan.FromMinutes(1)
            };

        // Useful for debugging JWT authentication
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine(
                    $"JWT Authentication Failed: " +
                    $"{context.Exception.Message}");

                return Task.CompletedTask;
            },

            OnTokenValidated = context =>
            {
                Console.WriteLine(
                    "JWT Token validated successfully.");

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Console.WriteLine(
                    $"JWT Challenge: {context.Error} " +
                    $"{context.ErrorDescription}");

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ============================================================
// JWT SERVICE
// ============================================================

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// ============================================================
// BUILD
// ============================================================

var app = builder.Build();

// ============================================================
// CORS
// IMPORTANT: Must be before Authentication/Authorization
// ============================================================

app.UseCors("DraftLexFrontend");

// ============================================================
// SWAGGER
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

// ============================================================
// HTTPS
// ============================================================

app.UseHttpsRedirection();

// ============================================================
// SECURITY HEADERS
// ============================================================

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] =
        "nosniff";

    context.Response.Headers["X-Frame-Options"] =
        "DENY";

    context.Response.Headers["Referrer-Policy"] =
        "strict-origin-when-cross-origin";

    context.Response.Headers["Permissions-Policy"] =
        "camera=(), microphone=(), geolocation=()";

    context.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; " +

        "img-src 'self' data: " +
        "http://localhost:5073 " +
        "https://4mf00dhb-5073.inc1.devtunnels.ms " +
        "https://draftlex-backend.vercel.app; " +

        "style-src 'self' 'unsafe-inline'; " +

        "script-src 'self'; " +

        "font-src 'self' data:; " +

        "connect-src 'self' " +
        "http://localhost:5173 " +
        "http://127.0.0.1:5173 " +
        "http://localhost:5073 " +
        "https://4mf00dhb-5073.inc1.devtunnels.ms; " +
        "https://draftlex-backend.vercel.app; " +

        "frame-ancestors 'none';";

    await next();
});

// ============================================================
// AUTHENTICATION / AUTHORIZATION
// ============================================================

app.UseAuthentication();

app.UseAuthorization();

// ============================================================
// UPLOADS
// ============================================================

var evidencePath = Path.Combine(
    Directory.GetCurrentDirectory(),
    "uploads");

Directory.CreateDirectory(evidencePath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider =
        new PhysicalFileProvider(evidencePath),

    RequestPath = "/uploads"
});

// ============================================================
// EXCEPTION MIDDLEWARE
// ============================================================

app.UseMiddleware<ExceptionMiddleware>();

// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();

// ============================================================
// RUN
// ============================================================

app.Run();