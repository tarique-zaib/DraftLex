using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public class DraftLexDbContext : DbContext, IDraftLexDbContext
{
    public DraftLexDbContext(DbContextOptions<DraftLexDbContext> options)
        : base(options)
    {
    }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Matter> Matters => Set<Matter>();
    public DbSet<Hearing> Hearings => Set<Hearing>();
    public DbSet<Advocate> Advocates => Set<Advocate>();
    public DbSet<TimelineEvent> TimelineEvents => Set<TimelineEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DraftLexDbContext).Assembly);
    }
}