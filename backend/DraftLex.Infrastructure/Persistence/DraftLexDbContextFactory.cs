using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DraftLex.Infrastructure.Persistence;

public class DraftLexDbContextFactory : IDesignTimeDbContextFactory<DraftLexDbContext>
{
    public DraftLexDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DraftLexDbContext>();

        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=draftlex;Username=postgres;Password=admin");

        return new DraftLexDbContext(optionsBuilder.Options);
    }
}