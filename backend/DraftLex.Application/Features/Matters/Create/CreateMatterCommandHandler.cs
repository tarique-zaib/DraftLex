using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Matters.Create;

public class CreateMatterCommandHandler : IRequestHandler<CreateMatterCommand, Guid>
{
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;


    public CreateMatterCommandHandler(IDraftLexDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateMatterCommand request, CancellationToken cancellationToken)
    {
        var clientExists = await _db.Clients
            .AnyAsync(c => c.Id == request.ClientId && c.IsActive, cancellationToken);

        if (!clientExists)
            throw new ArgumentException("Client not found.");

        // Generate next unique Matter Number
        var year = DateTime.UtcNow.Year;

        var lastMatterNumber = await _db.Matters
            .Where(m => m.MatterNumber.StartsWith($"MAT-{year}-"))
            .OrderByDescending(m => m.MatterNumber)
            .Select(m => m.MatterNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;

        if (!string.IsNullOrWhiteSpace(lastMatterNumber))
        {
            var lastPart = lastMatterNumber.Split('-').Last();

            if (int.TryParse(lastPart, out var sequence))
                nextNumber = sequence + 1;
        }

        var matterNumber = $"MAT-{year}-{nextNumber:D6}";

        var matter = new Matter
        {
            Id = Guid.NewGuid(),
            MatterNumber = matterNumber,
            ClientId = request.ClientId,
            Title = request.Title,
            MatterType = request.MatterType,
            Court = request.Court,
            CaseNumber = request.CaseNumber,
            JudgeName = request.JudgeName,
            OppositePartyName = request.OppositePartyName,
            OppositePartyAddress = request.OppositePartyAddress,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            AdvocateId = _currentUser.UserId
        };

        _db.Matters.Add(matter);

        _db.TimelineEvents.Add(new TimelineEvent
        {
            Id = Guid.NewGuid(),
            MatterId = matter.Id,
            EventType = "MatterCreated",
            Title = "Matter Registered",
            Description = $"Matter {matter.MatterNumber} created.",
            EventDate = DateTime.SpecifyKind(matter.CreatedAt, DateTimeKind.Unspecified),
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);

        return matter.Id;
    }
}