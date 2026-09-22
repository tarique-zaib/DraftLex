using MediatR;

namespace DraftLex.Application.Features.Hearings.Create;

public record CreateHearingCommand(
    Guid MatterId,
    DateTime HearingDate,
    string CourtRoom,
    string JudgeName,
    string Stage,
    string Remarks,
    DateTime? NextHearingDate
) : IRequest<Guid>;