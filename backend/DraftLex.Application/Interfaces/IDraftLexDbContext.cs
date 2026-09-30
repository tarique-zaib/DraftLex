using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Interfaces;

public interface IDraftLexDbContext
{
    DbSet<Matter> Matters { get; }
    DbSet<Client> Clients { get; }
    DbSet<Hearing> Hearings { get; }
    DbSet<TimelineEvent> TimelineEvents { get; }
    DbSet<Advocate> Advocates { get; }
    DbSet<LegalDocument> LegalDocuments { get; }
    DbSet<LegalClause> LegalClauses { get; }
    DbSet<CopilotMessage> CopilotMessages { get; }
    DbSet<MatterFee> MatterFees { get; }

    DbSet<MatterFeeEntry> MatterFeeEntries { get; }

    DbSet<Payment> Payments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}