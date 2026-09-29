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

    public async Task<Guid> Handle(
        CreateHearingCommand request,
        CancellationToken cancellationToken)
    {
        var matterExists = await _db.Matters
            .AnyAsync(
                m => m.Id == request.MatterId,
                cancellationToken);

        if (!matterExists)
            throw new ArgumentException("Matter not found.");

        // DraftLex uses India Standard Time for court hearing schedules.
        var indiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows()
                ? "India Standard Time"
                : "Asia/Kolkata");

        // The value coming from the hearing form represents
        // an India-local date/time.
        var hearingLocal = DateTime.SpecifyKind(
            request.HearingDate,
            DateTimeKind.Unspecified);

        // Convert India local time to UTC for PostgreSQL timestamptz.
        var hearingUtc = TimeZoneInfo.ConvertTimeToUtc(
            hearingLocal,
            indiaTimeZone);

        DateTime? nextHearingUtc = null;

        if (request.NextHearingDate.HasValue)
        {
            var nextHearingLocal = DateTime.SpecifyKind(
                request.NextHearingDate.Value,
                DateTimeKind.Unspecified);

            nextHearingUtc = TimeZoneInfo.ConvertTimeToUtc(
                nextHearingLocal,
                indiaTimeZone);
        }

        var hearing = new Hearing
        {
            Id = Guid.NewGuid(),
            MatterId = request.MatterId,

            HearingDate = hearingUtc,

            CourtRoom = request.CourtRoom,
            JudgeName = request.JudgeName,
            Stage = request.Stage,
            Remarks = request.Remarks,

            NextHearingDate = nextHearingUtc,

            CreatedAt = DateTime.UtcNow
        };

        _db.Hearings.Add(hearing);

        // Timeline description should display the
        // hearing in India local time.
        var hearingLocalForDisplay =
            TimeZoneInfo.ConvertTimeFromUtc(
                hearing.HearingDate,
                indiaTimeZone);

        _db.TimelineEvents.Add(new TimelineEvent
        {
            Id = Guid.NewGuid(),
            MatterId = hearing.MatterId,
            EventType = "HearingCreated",
            Title = "Hearing Scheduled",

            Description =
                $"A hearing has been scheduled for " +
                $"{hearingLocalForDisplay:dd MMM yyyy hh:mm tt}. " +
                $"Stage: {hearing.Stage}.",

            // TimelineEvents currently use an unspecified
            // court-event date.
            EventDate = DateTime.SpecifyKind(
                hearingLocalForDisplay,
                DateTimeKind.Unspecified),

            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);

        return hearing.Id;
    }
}