using DraftLex.Application.DTOs.Clients;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Services;

public class ClientService
{
    private readonly IClientRepository _repo;
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ClientService(
        IClientRepository repo,
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _repo = repo;
        _db = db;
        _currentUser = currentUser;
    }

    // Create Client
    public async Task<ClientResponse> CreateAsync(CreateClientRequest request)
    {
        var nextNumber = await _repo.GetNextClientSequenceAsync();

        var client = new Client
        {
            Id = Guid.NewGuid(),
            ClientCode = $"CL-{nextNumber:D6}",
            FullName = request.FullName,
            FatherName = request.FatherName,
            Mobile = request.Mobile,
            Email = request.Email,
            Address = request.Address,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            AdvocateId = _currentUser.UserId
        };

        await _repo.AddAsync(client);
        await _repo.SaveChangesAsync();

        return Map(client);
    }

    // Get All Clients (ONLY current advocate)
    public async Task<List<ClientResponse>> GetAllAsync()
    {
        var clients = await _db.Clients
            .Where(c => c.IsActive && c.AdvocateId == _currentUser.UserId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return clients.Select(Map).ToList();
    }

    // Get Client by Id (ONLY current advocate)
    public async Task<ClientResponse?> GetByIdAsync(Guid id)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.IsActive &&
                c.AdvocateId == _currentUser.UserId);

        return client == null ? null : Map(client);
    }

    // Update Client (ONLY current advocate)
    public async Task<bool> UpdateAsync(Guid id, UpdateClientRequest request)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.IsActive &&
                c.AdvocateId == _currentUser.UserId);

        if (client == null)
            return false;

        client.FullName = request.FullName;
        client.FatherName = request.FatherName;
        client.Mobile = request.Mobile;
        client.Email = request.Email;
        client.Address = request.Address;

        await _repo.UpdateAsync(client);
        await _repo.SaveChangesAsync();

        return true;
    }

    // Soft Delete Client (ONLY current advocate)
    public async Task<bool> DeleteAsync(Guid id)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.IsActive &&
                c.AdvocateId == _currentUser.UserId);

        if (client == null)
            return false;

        await _repo.SoftDeleteAsync(client);
        await _repo.SaveChangesAsync();

        return true;
    }

    private static ClientResponse Map(Client client)
    {
        return new ClientResponse
        {
            Id = client.Id,
            ClientCode = client.ClientCode,
            FullName = client.FullName,
            Mobile = client.Mobile,
            Email = client.Email,
            Address = client.Address,
        };
    }

    // ===========================
    // Client Matters
    // ===========================

    public async Task<List<ClientMatterResponse>> GetMattersAsync(Guid clientId)
    {
        var ownsClient = await _db.Clients.AnyAsync(c =>
            c.Id == clientId &&
            c.AdvocateId == _currentUser.UserId &&
            c.IsActive);

        if (!ownsClient)
            return [];

        return await _db.Matters
            .Where(m =>
                m.ClientId == clientId &&
                m.AdvocateId == _currentUser.UserId)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new ClientMatterResponse
            {
                Id = m.Id,
                MatterNumber = m.MatterNumber,
                Title = m.Title,
                Court = m.Court,
                Status = m.Status
            })
            .ToListAsync();
    }

    // ===========================
    // Client Hearings
    // ===========================

    public async Task<List<ClientHearingResponse>> GetHearingsAsync(Guid clientId)
    {
        var ownsClient = await _db.Clients.AnyAsync(c =>
            c.Id == clientId &&
            c.AdvocateId == _currentUser.UserId &&
            c.IsActive);

        if (!ownsClient)
            return [];

        return await _db.Hearings
            .Where(h =>
                h.Matter.ClientId == clientId &&
                h.Matter.AdvocateId == _currentUser.UserId)
            .OrderBy(h => h.HearingDate)
            .Select(h => new ClientHearingResponse
            {
                Id = h.Id,
                MatterId = h.MatterId,
                MatterTitle = h.Matter.Title,
                HearingDate = h.HearingDate,
                Stage = h.Stage,
                JudgeName = h.JudgeName,
                CourtRoom = h.CourtRoom
            })
            .ToListAsync();
    }

    // ===========================
    // Client Documents
    // ===========================

    public async Task<List<ClientDocumentResponse>> GetDocumentsAsync(Guid clientId)
    {
        var ownsClient = await _db.Clients.AnyAsync(c =>
            c.Id == clientId &&
            c.AdvocateId == _currentUser.UserId &&
            c.IsActive);

        if (!ownsClient)
            return [];

        return await _db.LegalDocuments
            .Where(d =>
                d.Matter.ClientId == clientId &&
                d.Matter.AdvocateId == _currentUser.UserId)
            .OrderByDescending(d => d.UpdatedAt)
            .Select(d => new ClientDocumentResponse
            {
                Id = d.Id,
                MatterId = d.MatterId,
                MatterTitle = d.Matter.Title,
                Title = d.Title,
                DocumentType = d.DocumentType,
                Version = d.Version,
                Status = d.Status,
                UpdatedAt = d.UpdatedAt
            })
            .ToListAsync();
    }

    // ===========================
    // Client Timeline
    // ===========================

    public async Task<List<ClientTimelineResponse>> GetTimelineAsync(Guid clientId)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c =>
                c.Id == clientId &&
                c.AdvocateId == _currentUser.UserId &&
                c.IsActive);

        if (client == null)
            return [];

        var timeline = new List<ClientTimelineResponse>
        {
            new()
            {
                Date = client.CreatedAt,
                Type = "Client",
                Title = "Client Created",
                Description = client.FullName
            }
        };

        var matters = await _db.Matters
            .Where(m =>
                m.ClientId == clientId &&
                m.AdvocateId == _currentUser.UserId)
            .ToListAsync();

        timeline.AddRange(matters.Select(m => new ClientTimelineResponse
        {
            Date = m.CreatedAt,
            Type = "Matter",
            Title = "Matter Created",
            Description = $"{m.MatterNumber} • {m.Title}"
        }));

        var hearings = await _db.Hearings
            .Include(h => h.Matter)
            .Where(h =>
                h.Matter.ClientId == clientId &&
                h.Matter.AdvocateId == _currentUser.UserId)
            .ToListAsync();

        timeline.AddRange(hearings.Select(h => new ClientTimelineResponse
        {
            Date = h.HearingDate,
            Type = "Hearing",
            Title = "Hearing Scheduled",
            Description = $"{h.Stage} • {h.Matter.Title}"
        }));

        var documents = await _db.LegalDocuments
            .Include(d => d.Matter)
            .Where(d =>
                d.Matter.ClientId == clientId &&
                d.Matter.AdvocateId == _currentUser.UserId)
            .ToListAsync();

        timeline.AddRange(documents.Select(d => new ClientTimelineResponse
        {
            Date = d.UpdatedAt,
            Type = "Document",
            Title = "Document Generated",
            Description = $"{d.DocumentType} • {d.Title}"
        }));

        return timeline
            .OrderByDescending(x => x.Date)
            .ToList();
    }
}