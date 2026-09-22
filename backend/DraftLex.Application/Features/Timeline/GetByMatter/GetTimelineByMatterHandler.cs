using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Timeline.GetByMatter;

public class GetTimelineByMatterHandler
    : IRequestHandler<GetTimelineByMatterQuery, List<TimelineEventResponse>>
{
    private readonly IDraftLexDbContext _db;

    public GetTimelineByMatterHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<List<TimelineEventResponse>> Handle(
        GetTimelineByMatterQuery request,
        CancellationToken cancellationToken)
    {
        return await _db.TimelineEvents
            .Where(t => t.MatterId == request.MatterId)
            .OrderByDescending(t => t.EventDate)
            .Select(t => new TimelineEventResponse
            {
                Id = t.Id,
                EventType = t.EventType,
                Title = t.Title,
                Description = t.Description,
                EventDate = t.EventDate
            })
            .ToListAsync(cancellationToken);
    }
}