using System.Text.Json;
using DraftLex.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DraftLex.Infrastructure.Persistence;

public class DraftLexDbContextFactory : IDesignTimeDbContextFactory<DraftLexDbContext>
{
    public DraftLexDbContext CreateDbContext(string[] args)
    {
        var apiPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "DraftLex.Api",
            "appsettings.json");

        var json = File.ReadAllText(apiPath);

        using var doc = JsonDocument.Parse(json);

        var connectionString = doc.RootElement
            .GetProperty("ConnectionStrings")
            .GetProperty("DraftLexDb")
            .GetString()
            ?? throw new InvalidOperationException("Connection string 'DraftLexDb' not found.");

        var optionsBuilder = new DbContextOptionsBuilder<DraftLexDbContext>();

        optionsBuilder.UseNpgsql(connectionString);

        return new DraftLexDbContext(
            optionsBuilder.Options,
            new DesignTimeCurrentUserService());
    }

    private sealed class DesignTimeCurrentUserService : ICurrentUserService
    {
        public Guid UserId => Guid.Empty;
        public bool IsAuthenticated => false;
    }
}