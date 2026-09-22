using System.Linq;
using Microsoft.EntityFrameworkCore;
using DraftLex.Application.Common.AI;
using DraftLex.Application.Features.Documents;
using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;

namespace DraftLex.Application.Services;

public class LegalDocumentService
{
    private readonly ILegalDocumentRepository _repo;
    private readonly IDraftLexDbContext _db;
    private readonly IAILegalDraftService _ai;

    public LegalDocumentService(
        ILegalDocumentRepository repo,
        IDraftLexDbContext db,
        IAILegalDraftService ai)
    {
        _repo = repo;
        _db = db;
        _ai = ai;
    }

    // Create Document
    public async Task<DocumentResponse> CreateAsync(CreateDocumentRequest request)
    {
        var matterExists = await _db.Matters.FindAsync(request.MatterId);

        if (matterExists == null)
            throw new ArgumentException("Matter not found.");

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            MatterId = request.MatterId,
            Title = request.Title,
            DocumentType = request.DocumentType,
            Content = request.Content,
            Version = 1,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(document);
        await _repo.SaveChangesAsync();

        return Map(document);
    }

    // Get Document
    public async Task<DocumentResponse?> GetByIdAsync(Guid id)
    {
        var document = await _repo.GetByIdAsync(id);

        return document == null ? null : Map(document);
    }

    // Get Documents for Matter
    public async Task<List<DocumentResponse>> GetByMatterAsync(Guid matterId)
    {
        var documents = await _repo.GetByMatterIdAsync(matterId);

        return documents.Select(Map).ToList();
    }

    // Update Document
    public async Task<bool> UpdateAsync(Guid id, UpdateDocumentRequest request)
    {
        var document = await _repo.GetByIdAsync(id);

        if (document == null)
            return false;

        document.Title = request.Title;
        document.Content = request.Content;
        document.Status = request.Status;
        document.Version += 1;
        document.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(document);
        await _repo.SaveChangesAsync();

        return true;
    }

    // Generate AI Document
    public async Task<DocumentResponse> GenerateAsync(GenerateDocumentRequest request)
    {
        var matter = await _db.Matters
            .Where(m => m.Title == request.MatterTitle)
            .FirstOrDefaultAsync();

        var clientName = request.ClientName;
        var matterTitle = request.MatterTitle;
        var court = request.Court;

        if (matter != null)
        {
            var client = await _db.Clients.FindAsync(matter.ClientId);

            if (client != null)
                clientName = client.FullName;

            matterTitle = matter.Title;
            court = matter.Court;
        }

        var content = await _ai.GenerateLegalDraftAsync(
            request.DocumentType,
            clientName,
            matterTitle,
            court,
            request.Facts);

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            MatterId = matter?.Id ?? Guid.Empty,
            Title = $"{request.DocumentType.ToUpper()} - {clientName.ToUpper()}",
            DocumentType = request.DocumentType,
            Content = content,
            Version = 1,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(document);
        await _repo.SaveChangesAsync();

        return Map(document);
    }

    // Get All Documents
    public async Task<List<DocumentResponse>> GetAllAsync()
    {
        var documents = await _repo.GetAllAsync();

        return documents.Select(Map).ToList();
    }

    private static DocumentResponse Map(LegalDocument document)
    {
        return new DocumentResponse
        {
            Id = document.Id,
            MatterId = document.MatterId,
            Title = document.Title,
            DocumentType = document.DocumentType,
            Content = document.Content,
            Version = document.Version,
            Status = document.Status,
            UpdatedAt = document.UpdatedAt
        };
    }
}