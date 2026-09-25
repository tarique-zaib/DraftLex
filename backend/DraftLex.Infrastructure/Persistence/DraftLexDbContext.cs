using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;



public class DraftLexDbContext : DbContext, IDraftLexDbContext
{
    private readonly ICurrentUserService _currentUser;

    public DraftLexDbContext(
        DbContextOptions<DraftLexDbContext> options,
        ICurrentUserService currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    // Per-request values (safe for EF query filters)
    private Guid CurrentUserId => _currentUser.UserId;
    private bool IsAuthenticated => _currentUser.IsAuthenticated;

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Matter> Matters => Set<Matter>();
    public DbSet<Hearing> Hearings => Set<Hearing>();
    public DbSet<Advocate> Advocates => Set<Advocate>();
    public DbSet<TimelineEvent> TimelineEvents => Set<TimelineEvent>();
    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();
    public DbSet<LegalClause> LegalClauses => Set<LegalClause>();
    public DbSet<CopilotMessage> CopilotMessages => Set<CopilotMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DraftLexDbContext).Assembly);

        modelBuilder.Entity<CopilotMessage>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Role)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(x => x.Content)
                .IsRequired();

            entity.HasOne(x => x.Matter)
                .WithMany(x => x.CopilotMessages)
                .HasForeignKey(x => x.MatterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =========================================================
        // GLOBAL QUERY FILTERS (Multi-Tenant Security)
        // =========================================================

        modelBuilder.Entity<Client>()
            .HasQueryFilter(c =>
                !IsAuthenticated ||
                c.AdvocateId == CurrentUserId);

        modelBuilder.Entity<Matter>()
            .HasQueryFilter(m =>
                !IsAuthenticated ||
                m.AdvocateId == CurrentUserId);

        modelBuilder.Entity<Hearing>()
            .HasQueryFilter(h =>
                !IsAuthenticated ||
                h.Matter.AdvocateId == CurrentUserId);

        modelBuilder.Entity<LegalDocument>()
            .HasQueryFilter(d =>
                !IsAuthenticated ||
                d.Matter.AdvocateId == CurrentUserId);

        modelBuilder.Entity<TimelineEvent>()
            .HasQueryFilter(t =>
                !IsAuthenticated ||
                t.Matter.AdvocateId == CurrentUserId);

        modelBuilder.Entity<LegalClause>().HasData(

            new LegalClause
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Title = "Payment Default Notice",
                Category = "Legal Notice",
                Content = "Our client calls upon you to clear the outstanding amount within fifteen (15) days from the receipt of this legal notice, failing which appropriate legal proceedings shall be initiated at your cost and risk.",
                IsSystemClause = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            new LegalClause
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Title = "Property Possession Demand",
                Category = "Property",
                Content = "You are hereby called upon to hand over vacant and peaceful possession of the property within fifteen (15) days, failing which my client shall initiate appropriate legal proceedings.",
                IsSystemClause = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            new LegalClause
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Title = "Employment Termination",
                Category = "Employment",
                Content = "Your services stand terminated in accordance with the applicable terms of employment and relevant provisions of law. You are required to complete the exit formalities immediately.",
                IsSystemClause = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            new LegalClause
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Title = "Consumer Complaint Relief",
                Category = "Consumer",
                Content = "My client calls upon you to rectify the deficiency in service and compensate the loss suffered within fifteen (15) days, failing which proceedings under the Consumer Protection Act shall be initiated.",
                IsSystemClause = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            new LegalClause
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Title = "Defamation Cease & Desist",
                Category = "Defamation",
                Content = "You are hereby called upon to immediately cease making defamatory statements concerning my client and issue a written apology within seven (7) days, failing which appropriate legal action shall be initiated.",
                IsSystemClause = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}