using MediatR;

namespace DraftLex.Application.Features.Hearings.GetByMatter;

public record GetHearingsByMatterQuery(Guid MatterId)
    : IRequest<List<HearingResponse>>;