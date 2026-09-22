using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using DraftLex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Infrastructure.Repositories;

public class LegalDocumentRepository : ILegalDocumentRepository
{
    private readonly DraftLexDbContext _db;

    public LegalDocumentRepository(DraftLexDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(LegalDocument document)
    {
        await _db.LegalDocuments.AddAsync(document);
    }

    public async Task<LegalDocument?> GetByIdAsync(Guid id)
    {
        return await _db.LegalDocuments.FindAsync(id);
    }

    public async Task<List<LegalDocument>> GetByMatterIdAsync(Guid matterId)
    {
        return await _db.LegalDocuments
            .Where(x => x.MatterId == matterId)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public Task UpdateAsync(LegalDocument document)
    {
        _db.LegalDocuments.Update(document);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}