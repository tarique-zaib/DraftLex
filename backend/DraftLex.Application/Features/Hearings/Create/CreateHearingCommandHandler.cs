using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Hearings.Create;

public class CreateHearingCommandHandler
    : IRequestHandler<CreateHearingCommand, Guid>
{
    private readonly IDraftLexDbContext _db;

    public CreateHearingCommandHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateHearingCommand request, CancellationToken cancellationToken)
    {
        var matterExists = await _db.Matters
            .AnyAsync(m => m.Id == request.MatterId, cancellationToken);

        if (!matterExists)
            throw new ArgumentException("Matter not found.");

        var hearing = new Hearing
        {
            Id = Guid.NewGuid(),
            MatterId = request.MatterId,

            // PostgreSQL timestamptz -> UTC
            HearingDate = DateTime.SpecifyKind(request.HearingDate, DateTimeKind.Utc),

            CourtRoom = request.CourtRoom,
            JudgeName = request.JudgeName,
            Stage = request.Stage,
            Remarks = request.Remarks,

            NextHearingDate = request.NextHearingDate.HasValue
        ? DateTime.SpecifyKind(request.NextHearingDate.Value, DateTimeKind.Utc)
        : null,

            CreatedAt = DateTime.UtcNow
        };

        _db.Hearings.Add(hearing);

        // Automatically create timeline event
        _db.TimelineEvents.Add(new TimelineEvent
        {
            Id = Guid.NewGuid(),
            MatterId = hearing.MatterId,
            EventType = "Hearing",
            Title = hearing.Stage,
            Description = hearing.Remarks,

            // Local court time
            EventDate = DateTime.SpecifyKind(hearing.HearingDate, DateTimeKind.Unspecified),

            // Audit timestamp
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);

        return hearing.Id;
    }
}