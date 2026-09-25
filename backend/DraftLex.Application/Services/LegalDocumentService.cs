using Microsoft.EntityFrameworkCore;
using DraftLex.Application.Common.AI;
using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;

namespace DraftLex.Application.Services;

public class LegalDocumentService
{
    private readonly ILegalDocumentRepository _repo;
    private readonly IDraftLexDbContext _db;
    private readonly IAILegalDraftService _ai;
    private readonly ICurrentUserService _currentUser;

    public LegalDocumentService(
        ILegalDocumentRepository repo,
        IDraftLexDbContext db,
        IAILegalDraftService ai,
        ICurrentUserService currentUser)
    {
        _repo = repo;
        _db = db;
        _ai = ai;
        _currentUser = currentUser;
    }

    // Create Document
    public async Task<DocumentResponse> CreateAsync(CreateDocumentRequest request)
    {
        var matter = await _db.Matters
            .FirstOrDefaultAsync(m =>
                m.Id == request.MatterId &&
                m.AdvocateId == _currentUser.UserId);

        if (matter == null)
            throw new UnauthorizedAccessException("Matter not found.");

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
        var document = await _db.LegalDocuments
            .Include(d => d.Matter)
            .FirstOrDefaultAsync(d =>
                d.Id == id &&
                d.Matter.AdvocateId == _currentUser.UserId);

        return document == null ? null : Map(document);
    }

    // Get Documents for Matter
    public async Task<List<DocumentResponse>> GetByMatterAsync(Guid matterId)
    {
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == matterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return [];

        return await _db.LegalDocuments
            .Where(d => d.MatterId == matterId)
            .OrderByDescending(d => d.UpdatedAt)
            .Select(d => new DocumentResponse
            {
                Id = d.Id,
                MatterId = d.MatterId,
                Title = d.Title,
                DocumentType = d.DocumentType,
                Content = d.Content,
                Version = d.Version,
                Status = d.Status,
                UpdatedAt = d.UpdatedAt
            })
            .ToListAsync();
    }

    // Update Document
    public async Task<bool> UpdateAsync(Guid id, UpdateDocumentRequest request)
    {
        var document = await _db.LegalDocuments
            .Include(d => d.Matter)
            .FirstOrDefaultAsync(d =>
                d.Id == id &&
                d.Matter.AdvocateId == _currentUser.UserId);

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
    public async Task<DocumentResponse> GenerateAsync(
        GenerateDocumentRequest request,
        string advocateName)
    {
        var matter = await _db.Matters
            .Include(m => m.Client)
            .Include(m => m.Hearings)
            .FirstOrDefaultAsync(m =>
                m.Id == request.MatterId &&
                m.AdvocateId == _currentUser.UserId);

        if (matter == null)
            throw new UnauthorizedAccessException("Matter not found.");

        var generatedContent = await _ai.GenerateLegalDraftAsync(
            request.DocumentType,
            matter.Client.FullName,
            matter.Title,
            matter.Court,
            request.Facts,
            advocateName,
            request.Language);

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            MatterId = matter.Id,
            Title = $"{request.DocumentType} - {matter.Client.FullName}",
            DocumentType = request.DocumentType,
            Content = generatedContent,
            Status = "Draft",
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.LegalDocuments.Add(document);
        await _db.SaveChangesAsync();

        return Map(document);
    }

    // Get All Documents
    public async Task<List<DocumentResponse>> GetAllAsync()
    {
        return await _db.LegalDocuments
            .Where(d => d.Matter.AdvocateId == _currentUser.UserId)
            .OrderByDescending(d => d.UpdatedAt)
            .Select(d => new DocumentResponse
            {
                Id = d.Id,
                MatterId = d.MatterId,
                Title = d.Title,
                DocumentType = d.DocumentType,
                Content = d.Content,
                Version = d.Version,
                Status = d.Status,
                UpdatedAt = d.UpdatedAt
            })
            .ToListAsync();
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