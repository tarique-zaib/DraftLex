using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Matters.Create;

public class CreateMatterCommandHandler : IRequestHandler<CreateMatterCommand, Guid>
{
    private readonly IDraftLexDbContext _db;

    public CreateMatterCommandHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateMatterCommand request, CancellationToken cancellationToken)
    {
        var clientExists = await _db.Clients
            .AnyAsync(c => c.Id == request.ClientId && c.IsActive, cancellationToken);

        if (!clientExists)
            throw new ArgumentException("Client not found.");

        var count = await _db.Matters.CountAsync(cancellationToken);

        var matter = new Matter
        {
            Id = Guid.NewGuid(),
            MatterNumber = $"MAT-{DateTime.UtcNow.Year}-{count + 1:D6}",
            ClientId = request.ClientId,
            Title = request.Title,
            MatterType = request.MatterType,
            Court = request.Court,
            CaseNumber = request.CaseNumber,
            JudgeName = request.JudgeName,

            // NEW
            OppositePartyName = request.OppositePartyName,
            OppositePartyAddress = request.OppositePartyAddress,

            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _db.Matters.Add(matter);

        // Automatically create timeline event
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