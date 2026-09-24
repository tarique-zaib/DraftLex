using MediatR;

namespace DraftLex.Application.Features.Hearings.GetById;

public record GetHearingByIdQuery(Guid HearingId)
    : IRequest<GetHearingByIdResponse>;