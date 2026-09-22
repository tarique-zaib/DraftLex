using DraftLex.Domain.Entities;

namespace DraftLex.Application.Interfaces;

public interface ILegalDocumentRepository
{
    Task AddAsync(LegalDocument document);

    Task<LegalDocument?> GetByIdAsync(Guid id);

    Task<List<LegalDocument>> GetByMatterIdAsync(Guid matterId);

    Task UpdateAsync(LegalDocument document);

    Task<List<LegalDocument>> GetAllAsync();

    Task SaveChangesAsync();
}