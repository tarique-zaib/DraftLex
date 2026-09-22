using MediatR;

namespace DraftLex.Application.Features.Timeline.GetByMatter;

public record GetTimelineByMatterQuery(Guid MatterId)
    : IRequest<List<TimelineEventResponse>>;